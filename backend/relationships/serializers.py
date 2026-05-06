from rest_framework import serializers

from users.serializers import UserPublicSerializer

from .models import FamilyRelationship


class FamilyRelationshipSerializer(serializers.ModelSerializer):
    owner = UserPublicSerializer(read_only=True)
    related_user = UserPublicSerializer(read_only=True)
    related_user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = FamilyRelationship
        fields = (
            "id",
            "owner",
            "related_user",
            "related_user_id",
            "relation_type",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        owner = self.context["request"].user
        related_user_id = attrs.get("related_user_id")
        if owner.id == related_user_id:
            raise serializers.ValidationError("You cannot relate yourself.")
        return attrs

    def create(self, validated_data):
        related_user_id = validated_data.pop("related_user_id")
        validated_data["owner"] = self.context["request"].user
        validated_data["related_user_id"] = related_user_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        related_user_id = validated_data.pop("related_user_id", None)
        if related_user_id is not None:
            instance.related_user_id = related_user_id
        return super().update(instance, validated_data)
