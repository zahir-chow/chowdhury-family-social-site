from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "display_name", "is_active", "is_moderator", "is_staff")
    list_filter = ("is_active", "is_moderator", "is_staff", "is_superuser")
    search_fields = ("email", "display_name")
    readonly_fields = ("last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("display_name", "avatar", "bio")}),
        ("Permissions", {"fields": ("is_active", "is_moderator", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "display_name", "password1", "password2", "is_active", "is_moderator", "is_staff"),
            },
        ),
    )
