import pytest
from rest_framework.test import APIClient

from users.models import User

from .models import FriendRequest, Friendship, Post, Reaction


@pytest.mark.django_db
def test_friend_acceptance_creates_friendship():
    sender = User.objects.create_user(email="sender@test.com", display_name="Sender", password="testpass123")
    receiver = User.objects.create_user(email="receiver@test.com", display_name="Receiver", password="testpass123")
    friend_request = FriendRequest.objects.create(from_user=sender, to_user=receiver)

    client = APIClient()
    client.force_authenticate(receiver)
    response = client.post(f"/api/v1/social/friend-requests/{friend_request.id}/action/", {"action": "accept"}, format="json")

    assert response.status_code == 200
    assert Friendship.objects.count() == 1
    friendship = Friendship.objects.first()
    assert friendship.user_a_id == min(sender.id, receiver.id)
    assert friendship.user_b_id == max(sender.id, receiver.id)


@pytest.mark.django_db
def test_feed_excludes_non_friend_posts():
    owner = User.objects.create_user(email="owner@test.com", display_name="Owner", password="testpass123")
    friend = User.objects.create_user(email="friend@test.com", display_name="Friend", password="testpass123")
    outsider = User.objects.create_user(email="outsider@test.com", display_name="Outsider", password="testpass123")
    Friendship.objects.create(user_a=min(owner, friend, key=lambda u: u.id), user_b=max(owner, friend, key=lambda u: u.id))
    Post.objects.create(author=friend, body="Visible")
    Post.objects.create(author=outsider, body="Hidden")

    client = APIClient()
    client.force_authenticate(owner)
    response = client.get("/api/v1/social/posts/")

    assert response.status_code == 200
    results = response.json()["results"]
    bodies = [item["body"] for item in results]
    assert "Visible" in bodies
    assert "Hidden" not in bodies


@pytest.mark.django_db
def test_moderator_can_soft_delete_post():
    author = User.objects.create_user(email="author@test.com", display_name="Author", password="testpass123")
    moderator = User.objects.create_user(
        email="mod@test.com",
        display_name="Moderator",
        password="testpass123",
        is_moderator=True,
    )
    post = Post.objects.create(author=author, body="Test Post")

    client = APIClient()
    client.force_authenticate(moderator)
    response = client.delete(f"/api/v1/social/posts/{post.id}/")

    assert response.status_code == 204
    post.refresh_from_db()
    assert post.is_deleted is True
    assert post.deleted_by_id == moderator.id


@pytest.mark.django_db
def test_reaction_is_unique_per_user_per_post():
    user = User.objects.create_user(email="reactor@test.com", display_name="Reactor", password="testpass123")
    friend = User.objects.create_user(email="friend2@test.com", display_name="Friend2", password="testpass123")
    user_a, user_b = sorted([user.id, friend.id])
    Friendship.objects.create(user_a_id=user_a, user_b_id=user_b)
    post = Post.objects.create(author=friend, body="Hello")

    client = APIClient()
    client.force_authenticate(user)
    first = client.post(f"/api/v1/social/posts/{post.id}/reaction/", {"reaction_type": "like"}, format="json")
    second = client.post(f"/api/v1/social/posts/{post.id}/reaction/", {"reaction_type": "love"}, format="json")

    assert first.status_code == 200
    assert second.status_code == 200
    assert Reaction.objects.filter(post=post, user=user).count() == 1
    assert Reaction.objects.get(post=post, user=user).reaction_type == "love"
