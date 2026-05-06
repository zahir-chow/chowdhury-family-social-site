from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me, name="me"),
    path("change-password/", views.change_password, name="change-password"),
    path("directory/", views.directory, name="directory"),
    path("members/", views.members, name="members"),
    path("register/", views.register, name="register"),
    path("members/<int:user_id>/status/", views.member_status, name="member-status"),
    path("<int:user_id>/", views.user_detail, name="user-detail"),
]
