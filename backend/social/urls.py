from django.urls import path

from . import views

urlpatterns = [
    path("posts/", views.posts, name="posts"),
    path("posts/<int:post_id>/", views.post_detail, name="post-detail"),
    path("posts/<int:post_id>/comments/", views.post_comments, name="post-comments"),
    path("comments/<int:comment_id>/", views.comment_detail, name="comment-detail"),
    path("posts/<int:post_id>/reaction/", views.post_reaction, name="post-reaction"),
]
