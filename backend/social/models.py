from django.db import models

from users.models import User


class Post(models.Model):
    author = models.ForeignKey(User, related_name="posts", on_delete=models.CASCADE)
    body = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, related_name="deleted_posts", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Post:{self.id} by {self.author_id}"


class PostImage(models.Model):
    post = models.ForeignKey(Post, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="posts/")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]


class Comment(models.Model):
    post = models.ForeignKey(Post, related_name="comments", on_delete=models.CASCADE)
    author = models.ForeignKey(User, related_name="comments", on_delete=models.CASCADE)
    parent = models.ForeignKey("self", related_name="replies", on_delete=models.CASCADE, null=True, blank=True)
    body = models.TextField()
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, related_name="deleted_comments", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Reaction(models.Model):
    class ReactionType(models.TextChoices):
        LIKE = "like", "Like"
        LOVE = "love", "Love"
        CARE = "care", "Care"
        WOW = "wow", "Wow"
        SAD = "sad", "Sad"
        ANGRY = "angry", "Angry"

    post = models.ForeignKey(Post, related_name="reactions", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="reactions", on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=20, choices=ReactionType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["post", "user"], name="unique_post_reaction"),
        ]
