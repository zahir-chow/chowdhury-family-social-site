from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "display_name", "avatar", "bio", "is_active", "is_moderator")


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("display_name", "avatar", "bio")


class MemberCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "display_name", "password", "bio", "avatar", "is_active", "is_moderator")

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "display_name", "password", "gender")

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        # By default, new users are active but not moderators
        return User.objects.create_user(password=password, is_active=True, is_moderator=False, **validated_data)
