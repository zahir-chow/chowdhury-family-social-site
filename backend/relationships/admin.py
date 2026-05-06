from django.contrib import admin

from .models import FamilyRelationship


@admin.register(FamilyRelationship)
class FamilyRelationshipAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "related_user", "relation_type", "created_at")
    list_filter = ("relation_type",)
    search_fields = ("owner__display_name", "owner__email", "related_user__display_name", "related_user__email")
