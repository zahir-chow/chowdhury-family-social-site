from django.urls import path

from . import views

urlpatterns = [
    path("user/<int:user_id>/", views.relationships_by_user, name="relationships-by-user"),
    path("", views.relationship_create, name="relationship-create"),
    path("<int:relationship_id>/", views.relationship_detail, name="relationship-detail"),
]
