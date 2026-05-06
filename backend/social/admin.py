from django.contrib import admin

from .models import Comment, Post, PostImage, Reaction

admin.site.register(Post)
admin.site.register(PostImage)
admin.site.register(Comment)
admin.site.register(Reaction)
