from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import User

from .models import Comment, Post, PostImage, Reaction
from .serializers import (
    CommentSerializer,
    PostSerializer,
    ReactionSerializer,
)


def _is_moderator(user):
    return user.is_authenticated and (user.is_moderator or user.is_staff or user.is_superuser)


def _paginate(request, queryset, serializer_class):
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page if page is not None else queryset, many=True)
    if page is not None:
        return paginator.get_paginated_response(serializer.data)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def posts(request):
    if request.method == "GET":
        # Any logged in user can see any post
        queryset = (
            Post.objects.filter(is_deleted=False)
            .select_related("author")
            .prefetch_related("images")
            .annotate(
                comment_count=Count("comments", filter=Q(comments__is_deleted=False), distinct=True),
                reaction_count=Count("reactions", distinct=True),
            )
            .order_by("-created_at")
        )
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PostSerializer(page if page is not None else queryset, many=True, context={"request": request})
        if page is not None:
            return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)

    body = request.data.get("body", "").strip()
    images = request.FILES.getlist("images")
    if not body and not images:
        return Response({"detail": "Post body or at least one image is required."}, status=status.HTTP_400_BAD_REQUEST)

    post = Post.objects.create(author=request.user, body=body)
    for index, image in enumerate(images):
        PostImage.objects.create(post=post, image=image, sort_order=index)
    post = Post.objects.select_related("author").prefetch_related("images").get(id=post.id)
    return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_posts(request, user_id):
    """Return all posts by a specific user, latest first."""
    get_object_or_404(User, id=user_id, is_active=True)
    queryset = (
        Post.objects.filter(author_id=user_id, is_deleted=False)
        .select_related("author")
        .prefetch_related("images")
        .annotate(
            comment_count=Count("comments", filter=Q(comments__is_deleted=False), distinct=True),
            reaction_count=Count("reactions", distinct=True),
        )
        .order_by("-created_at")
    )
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = PostSerializer(page if page is not None else queryset, many=True, context={"request": request})
    if page is not None:
        return paginator.get_paginated_response(serializer.data)
    return Response(serializer.data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def post_detail(request, post_id):
    post = get_object_or_404(Post.objects.select_related("author").prefetch_related("images"), id=post_id)
    if post.is_deleted:
        return Response({"detail": "Post not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        if post.author_id != request.user.id and not _is_moderator(request.user):
            return Response({"detail": "Not allowed to delete this post."}, status=status.HTTP_403_FORBIDDEN)
        post.is_deleted = True
        post.deleted_at = timezone.now()
        post.deleted_by = request.user
        post.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    if post.author_id != request.user.id:
        return Response({"detail": "Only the author can edit this post."}, status=status.HTTP_403_FORBIDDEN)

    post.body = request.data.get("body", post.body)
    if request.data.get("replace_images") == "true":
        post.images.all().delete()
        for index, image in enumerate(request.FILES.getlist("images")):
            PostImage.objects.create(post=post, image=image, sort_order=index)
    post.save(update_fields=["body", "updated_at"])
    return Response(PostSerializer(post, context={"request": request}).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def post_comments(request, post_id):
    post = get_object_or_404(Post.objects.select_related("author"), id=post_id, is_deleted=False)
    # No more friend check here

    if request.method == "GET":
        comments = Comment.objects.filter(post=post, is_deleted=False).select_related("author").order_by("created_at")
        return _paginate(request, comments, CommentSerializer)

    body = request.data.get("body", "").strip()
    parent_id = request.data.get("parent_id")
    if not body:
        return Response({"detail": "Comment body is required."}, status=status.HTTP_400_BAD_REQUEST)
    
    parent = None
    if parent_id:
        parent = get_object_or_404(Comment, id=parent_id, post=post)

    comment = Comment.objects.create(post=post, author=request.user, body=body, parent=parent)
    return Response(CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def comment_detail(request, comment_id):
    comment = get_object_or_404(Comment.objects.select_related("author"), id=comment_id)
    if comment.is_deleted:
        return Response(status=status.HTTP_204_NO_CONTENT)
    if comment.author_id != request.user.id and not _is_moderator(request.user):
        return Response({"detail": "Not allowed to delete this comment."}, status=status.HTTP_403_FORBIDDEN)
    comment.is_deleted = True
    comment.deleted_at = timezone.now()
    comment.deleted_by = request.user
    comment.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def post_reaction(request, post_id):
    post = get_object_or_404(Post.objects.select_related("author"), id=post_id, is_deleted=False)
    # No more friend check here

    if request.method == "DELETE":
        Reaction.objects.filter(post=post, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    reaction_type = request.data.get("reaction_type")
    if not reaction_type:
        return Response({"detail": "reaction_type is required."}, status=status.HTTP_400_BAD_REQUEST)
    if reaction_type not in dict(Reaction.ReactionType.choices):
        return Response({"detail": "Invalid reaction_type."}, status=status.HTTP_400_BAD_REQUEST)
    reaction, _ = Reaction.objects.update_or_create(
        post=post,
        user=request.user,
        defaults={"reaction_type": reaction_type},
    )
    return Response(ReactionSerializer(reaction).data)
