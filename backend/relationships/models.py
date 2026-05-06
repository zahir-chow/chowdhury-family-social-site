from django.db import models

from users.models import User


class FamilyRelationship(models.Model):
    class RelationshipType(models.TextChoices):
        FATHER = "father", "Father"
        MOTHER = "mother", "Mother"
        BROTHER = "brother", "Brother"
        SISTER = "sister", "Sister"
        SPOUSE = "spouse", "Spouse"
        SON = "son", "Son"
        DAUGHTER = "daughter", "Daughter"
        HUSBAND = "husband", "Husband"
        WIFE = "wife", "Wife"
        PARENT = "parent", "Parent"
        CHILD = "child", "Child"
        SIBLING = "sibling", "Sibling"
        OTHER = "other", "Other"

    owner = models.ForeignKey(User, related_name="relationships_owned", on_delete=models.CASCADE)
    related_user = models.ForeignKey(User, related_name="relationships_related", on_delete=models.CASCADE)
    relation_type = models.CharField(max_length=30, choices=RelationshipType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner", "related_user"], name="unique_owner_related_user"),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.owner_id}->{self.related_user_id}:{self.relation_type}"


from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver


@receiver(post_save, sender=FamilyRelationship)
def create_reciprocal_relationship(sender, instance, created, **kwargs):
    if not created:
        return

    # To avoid recursion, check if it already exists
    # If A added B as daughter, and A is female, B should have A as mother.
    # We need to know A's gender.

    owner = instance.owner
    related_user = instance.related_user
    rel_type = instance.relation_type

    reciprocal_type = "other"

    if rel_type in ["father", "mother", "parent"]:
        if owner.gender == "male":
            reciprocal_type = "son"  # Default to son if we don't know related_user gender?
            if related_user.gender == "female":
                reciprocal_type = "daughter"
            elif related_user.gender == "other":
                reciprocal_type = "child"
        elif owner.gender == "female":
            reciprocal_type = "son"
            if related_user.gender == "female":
                reciprocal_type = "daughter"
            elif related_user.gender == "other":
                reciprocal_type = "child"
        else:
            reciprocal_type = "child"

    # Simplified mapping
    mapping = {
        "father": {"male": "son", "female": "daughter", "other": "child"},
        "mother": {"male": "son", "female": "daughter", "other": "child"},
        "son": {"male": "father", "female": "mother", "other": "parent"},
        "daughter": {"male": "father", "female": "mother", "other": "parent"},
        "brother": {"male": "brother", "female": "sister", "other": "sibling"},
        "sister": {"male": "brother", "female": "sister", "other": "sibling"},
        "spouse": {"male": "spouse", "female": "spouse", "other": "spouse"},
        "husband": {"male": "wife", "female": "wife", "other": "spouse"},
        "wife": {"male": "husband", "female": "husband", "other": "spouse"},
        "parent": {"male": "son", "female": "daughter", "other": "child"},
        "child": {"male": "father", "female": "mother", "other": "parent"},
        "sibling": {"male": "brother", "female": "sister", "other": "sibling"},
    }

    if rel_type in mapping:
        reciprocal_type = mapping[rel_type].get(owner.gender, "other")

    FamilyRelationship.objects.get_or_create(
        owner=related_user,
        related_user=owner,
        defaults={"relation_type": reciprocal_type},
    )


@receiver(post_save, sender=FamilyRelationship)
def infer_sibling_relationships(sender, instance, created, **kwargs):
    if not created:
        return

    # If A adds B as a child, then B is a sibling to all other children of A
    if instance.relation_type in ["son", "daughter", "child"]:
        parent = instance.owner
        new_child = instance.related_user

        other_children = FamilyRelationship.objects.filter(
            owner=parent, relation_type__in=["son", "daughter", "child"]
        ).exclude(related_user=new_child)

        for other in other_children:
            child_other = other.related_user

            # new_child -> child_other
            sib_type = "sibling"
            if child_other.gender == "male":
                sib_type = "brother"
            elif child_other.gender == "female":
                sib_type = "sister"

            FamilyRelationship.objects.get_or_create(
                owner=new_child,
                related_user=child_other,
                defaults={"relation_type": sib_type},
            )
            # The reciprocal (child_other -> new_child) will be handled by create_reciprocal_relationship
            # when the above get_or_create triggers its own post_save.


@receiver(post_delete, sender=FamilyRelationship)
def delete_reciprocal_relationship(sender, instance, **kwargs):
    # If A deletes relationship with B, delete B's relationship with A
    FamilyRelationship.objects.filter(owner=instance.related_user, related_user=instance.owner).delete()
