from rest_framework import serializers

from users.serializers import UserPublicSerializer

from .models import Comment, Post, PostImage, Reaction


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ("id", "image", "sort_order")


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    reaction_count = serializers.IntegerField(read_only=True)
    my_reaction = serializers.SerializerMethodField()
    reaction_summary = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "author",
            "body",
            "is_deleted",
            "created_at",
            "updated_at",
            "images",
            "comment_count",
            "reaction_count",
            "my_reaction",
            "reaction_summary",
        )
        read_only_fields = ("is_deleted",)

    def get_my_reaction(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            if reaction:
                return reaction.reaction_type
        return None

    def get_reaction_summary(self, obj):
        from django.db.models import Count
        counts = obj.reactions.values("reaction_type").annotate(count=Count("reaction_type"))
        return {item["reaction_type"]: item["count"] for item in counts}


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "post", "author", "parent", "body", "is_deleted", "created_at")
        read_only_fields = ("post", "is_deleted")


class ReactionSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ("id", "post", "user", "reaction_type", "created_at", "updated_at")
        read_only_fields = ("post",)
