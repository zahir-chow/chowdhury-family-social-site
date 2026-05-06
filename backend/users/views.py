from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User
from .serializers import (
    MemberCreateSerializer,
    UserPublicSerializer,
    UserRegistrationSerializer,
    UserSelfUpdateSerializer,
)


def _is_moderator(user):
    return user.is_authenticated and (user.is_moderator or user.is_staff or user.is_superuser)


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes"}:
            return True
        if lowered in {"false", "0", "no"}:
            return False
    raise ValueError("Invalid boolean value.")


def _paginate(request, queryset, serializer_class):
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(page if page is not None else queryset, many=True)
    if page is not None:
        return paginator.get_paginated_response(serializer.data)
    return Response(serializer.data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def me(request):
    if request.method == "GET":
        serializer = UserPublicSerializer(request.user)
        return Response(serializer.data)

    serializer = UserSelfUpdateSerializer(instance=request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserPublicSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id):
    user = get_object_or_404(User, id=user_id, is_active=True)
    serializer = UserPublicSerializer(user)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def directory(request):
    queryset = User.objects.filter(is_active=True).order_by("display_name")
    return _paginate(request, queryset, UserPublicSerializer)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def members(request):
    if not _is_moderator(request.user):
        return Response({"detail": "Moderator permission required."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        queryset = User.objects.all().order_by("display_name")
        return _paginate(request, queryset, UserPublicSerializer)

    serializer = MemberCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserPublicSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def member_status(request, user_id):
    if not _is_moderator(request.user):
        return Response({"detail": "Moderator permission required."}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, id=user_id)
    is_active = request.data.get("is_active")
    if is_active is None:
        return Response({"detail": "is_active is required."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user.is_active = _parse_bool(is_active)
    except ValueError:
        return Response({"detail": "is_active must be a boolean."}, status=status.HTTP_400_BAD_REQUEST)
    user.save(update_fields=["is_active"])
    return Response(UserPublicSerializer(user).data)


@api_view(["POST"])
@permission_classes([])  # Public endpoint
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserPublicSerializer(user).data, status=status.HTTP_201_CREATED)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response({"detail": "Old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

    if not request.user.check_password(old_password):
        return Response({"detail": "Invalid old password."}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError

    try:
        validate_password(new_password, user=request.user)
    except ValidationError as e:
        return Response({"detail": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(new_password)
    request.user.save()
    return Response({"detail": "Password changed successfully."})
