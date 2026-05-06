from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import FamilyRelationship
from .serializers import FamilyRelationshipSerializer


def _paginate(request, queryset):
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = FamilyRelationshipSerializer(page if page is not None else queryset, many=True)
    if page is not None:
        return paginator.get_paginated_response(serializer.data)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def relationships_by_user(request, user_id):
    queryset = FamilyRelationship.objects.filter(owner_id=user_id).select_related("owner", "related_user")
    return _paginate(request, queryset)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def relationship_create(request):
    serializer = FamilyRelationshipSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    relationship = serializer.save()
    return Response(
        FamilyRelationshipSerializer(relationship, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def relationship_detail(request, relationship_id):
    relationship = get_object_or_404(
        FamilyRelationship.objects.select_related("owner", "related_user"), id=relationship_id
    )
    if relationship.owner_id != request.user.id:
        return Response({"detail": "You can only manage your own relationships."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        relationship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = FamilyRelationshipSerializer(
        relationship,
        data=request.data,
        partial=True,
        context={"request": request},
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(FamilyRelationshipSerializer(relationship, context={"request": request}).data)
from django.shortcuts import render

# Create your views here.
