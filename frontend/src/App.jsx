import { useEffect, useMemo, useState, useRef } from "react";
import "./App.css";
import loginHero from "./assets/login-hero.jpg";
import {
  API_BASE_URL,
  resolveBackendUrl,
  addComment,
  clearTokens,
  createPost,
  createRelationship,
  deleteComment,
  deletePost,
  deleteRelationship,
  updatePost,
  fetchComments,
  fetchDirectory,
  fetchFeed,
  fetchMe,
  fetchModerationMembers,
  fetchRelationships,
  fetchUser,
  getStoredTokens,
  login,
  reactToPost,
  removeReaction,
  register,
  storeTokens,
  updateMemberStatus,
  updateMe,
  updateRelationship,
  changePassword,
  fetchUserPosts,
} from "./api";

const RELATIONSHIP_OPTIONS = [
  "father",
  "mother",
  "husband",
  "wife",
  "brother",
  "sister",
  "son",
  "daughter",
  "parent",
  "child",
  "sibling",
  "spouse",
  "other",
];

const REACTION_MAP = {
  like: "👍",
  love: "❤️",
  care: "🥰",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

const REACTION_OPTIONS = Object.keys(REACTION_MAP);

const NAV_ITEMS = [
  { id: "feed", label: "Feed" },
  { id: "directory", label: "Family Members" },
  { id: "profile", label: "My Profile" },
];

function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString();
}

function getFriendDisplay(friendship, meId) {
  return friendship.user_a.id === meId ? friendship.user_b : friendship.user_a;
}

function LoginScreen({ onLogin, onToggleAuth, pending, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event) {
    event.preventDefault();
    onLogin(email, password);
  }

  return (
    <div className="auth-shell">
      <div className="auth-image-side">
        <img src={loginHero} alt="Family gathering" />
        <div className="image-overlay">
          <h2>Chowdhury Family</h2>
          <p>Preserving memories, connecting generations.</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-panel">
          <div className="brand-mark">CF</div>
          <p className="eyebrow">Private family circle</p>
          <h1>Welcome Back</h1>
          <p className="muted">
            Sign in to access your family's private updates and memories.
          </p>
          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="family@example.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
              />
            </label>
            {error ? <div className="alert error">{error}</div> : null}
            <button type="submit" className="primary-button full-width" disabled={pending}>
              {pending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <button onClick={onToggleAuth}>Register here</button>
          </p>

          <div className="demo-credentials">
            <p className="helper-text">Demo Credentials:</p>
            <div className="credential-group">
              <strong>User:</strong> <code>user@example.com</code> / <code>password123</code>
            </div>
            <div className="credential-group">
              <strong>Admin:</strong> <code>admin@example.com</code> / <code>admin123</code>
            </div>
          </div>

          <div className="api-chip">API: {API_BASE_URL}</div>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ onRegister, onToggleAuth, pending, error }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("other");

  function submit(event) {
    event.preventDefault();
    onRegister(email, displayName, password, gender);
  }

  return (
    <div className="auth-shell">
      <div className="auth-image-side">
        <img src={loginHero} alt="Family gathering" />
        <div className="image-overlay">
          <h2>Join the Circle</h2>
          <p>Connecting the Chowdhury family across the globe.</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-panel">
          <div className="brand-mark">CF</div>
          <p className="eyebrow">New member registration</p>
          <h1>Create Account</h1>
          <p className="muted"> Join your family's private network to share and explore. </p>
          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>Full Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="John Chowdhury"
                required
              />
            </label>
            <label>
              <span>Gender</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="auth-select">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="family@example.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                required
                minLength={8}
              />
            </label>
            {error ? <div className="alert error">{error}</div> : null}
            <button type="submit" className="primary-button full-width" disabled={pending}>
              {pending ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <button onClick={onToggleAuth}>Sign in here</button>
          </p>

          <div className="api-chip">API: {API_BASE_URL}</div>
        </div>
      </div>
    </div>
  );
}

function Composer({ onSubmit, pending }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(body, files);
    setBody("");
    setFiles([]);
    event.target.reset();
  }

  return (
    <form className="card composer" onSubmit={handleSubmit}>
      <div className="section-title-row">
        <h2>Create a family post</h2>
        <span className="soft-badge">Friends can see it</span>
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Share family news, memories, or announcements..."
        rows={5}
      />
      <label className="file-input">
        <span>Add photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
        />
      </label>
      {files.length ? <p className="muted">{files.length} image(s) selected.</p> : null}
      <button type="submit" className="primary-button" disabled={pending}>
        {pending ? "Posting..." : "Share"}
      </button>
    </form>
  );
}

function CommentItem({ comment, replies, onReply, onDelete, me }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  return (
    <div className="comment-item-wrapper">
      <div className="comment-main-box">
        <div className="avatar-circle small">
          {comment.author.avatar ? (
            <img src={resolveBackendUrl(comment.author.avatar)} alt="Avatar" />
          ) : (
            comment.author.display_name[0]
          )}
        </div>
        <div className="comment-content-bubble">
          <div className="comment-bubble-inner">
            <strong>{comment.author.display_name}</strong>
            <p>{comment.body}</p>
          </div>
          <div className="comment-actions-row">
            <button className="text-button xsmall" onClick={() => setShowReplyForm(!showReplyForm)}>
              Reply
            </button>
            {comment.author.id === me?.id ? (
              <button className="text-button xsmall danger" onClick={() => onDelete(comment.id)}>
                Delete
              </button>
            ) : null}
            <span className="muted xsmall">{formatDate(comment.created_at)}</span>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="reply-form-box">
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            autoFocus
          />
          <button
            className="primary-button small"
            onClick={() => {
              if (replyBody.trim()) {
                onReply(comment.id, replyBody.trim());
                setReplyBody("");
                setShowReplyForm(false);
              }
            }}
          >
            Reply
          </button>
        </div>
      )}

      {replies && replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} replies={[]} onReply={onReply} onDelete={onDelete} me={me} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedPost({
  post,
  me,
  comments,
  openComments,
  commentsLoading,
  commentDrafts,
  onToggleComments,
  onCommentDraftChange,
  onAddComment,
  onDeleteComment,
  onDeletePost,
  onEditPost,
  onReact,
  onRemoveReaction,
  onViewProfile,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [editPending, setEditPending] = useState(false);
  const closeTimeout = useRef(null);

  function handleMouseEnter() {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setShowReactions(true);
  }

  function handleMouseLeave() {
    closeTimeout.current = setTimeout(() => {
      setShowReactions(false);
    }, 300); // 300ms delay for stability
  }

  async function handleSaveEdit() {
    try {
      setEditPending(true);
      await onEditPost(post.id, editBody);
      setIsEditing(false);
    } catch (err) {
      // error handled by parent
    } finally {
      setEditPending(false);
    }
  }

  const topReactions = useMemo(() => {
    if (!post.reaction_summary) return [];
    return Object.entries(post.reaction_summary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [post.reaction_summary]);

  const nestedComments = useMemo(() => {
    if (!comments) return [];
    const roots = comments.filter((c) => !c.parent);
    const children = comments.filter((c) => c.parent);
    return roots.map((root) => ({
      ...root,
      replies: children.filter((child) => child.parent === root.id),
    }));
  }, [comments]);

  return (
    <div className="card post-card">
      <div className="post-header">
        <div className="user-info-row">
          <div className="avatar-circle clickable" onClick={() => onViewProfile(post.author.id)}>
            {post.author.avatar ? (
              <img src={resolveBackendUrl(post.author.avatar)} alt="Avatar" />
            ) : (
              post.author.display_name[0]
            )}
          </div>
          <div>
            <strong className="author-name clickable" onClick={() => onViewProfile(post.author.id)}>{post.author.display_name}</strong>
            <p className="muted small">{formatDate(post.created_at)}</p>
          </div>
        </div>
        {post.author.id === me?.id ? (
          <div className="post-header-actions">
            <button className="icon-button" onClick={() => { setIsEditing(!isEditing); setEditBody(post.body); }} title="Edit post">
              ✏️
            </button>
            <button className="icon-button danger" onClick={() => onDeletePost(post.id)} title="Delete post">
              🗑️
            </button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="post-edit-form">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="post-edit-actions">
            <button className="primary-button small" onClick={handleSaveEdit} disabled={editPending}>
              {editPending ? "Saving..." : "Save"}
            </button>
            <button className="ghost-button small" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="post-body">{post.body}</div>
      )}

      {post.images.length > 0 && (
        <div className="post-images-grid">
          {post.images.map((img) => (
            <img key={img.id} src={resolveBackendUrl(img.image)} alt="Post attachment" />
          ))}
        </div>
      )}

      <div className="post-stats-row">
        <div className="reaction-summary-fb">
          {topReactions.length > 0 && (
            <div className="reaction-icons">
              {topReactions.map(([type]) => (
                <span key={type} className="reaction-icon-circle">
                  {REACTION_MAP[type]}
                </span>
              ))}
            </div>
          )}
          <span className="muted small">
            {post.reaction_count > 0 ? `${post.reaction_count} people reacted` : "No reactions yet"}
          </span>
        </div>
        <div className="comment-stats muted small">{post.comment_count} comments</div>
      </div>

      <div className="post-actions-fb">
        <div className="like-wrapper-fb" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <button
            className={`action-btn-fb ${post.my_reaction ? "active" : ""}`}
            onClick={() => (post.my_reaction ? onRemoveReaction(post.id) : onReact(post.id, "like"))}
          >
            {post.my_reaction ? REACTION_MAP[post.my_reaction] : "👍"} {post.my_reaction || "Like"}
          </button>
          {showReactions && (
            <div className="reaction-popover-fb" onMouseEnter={handleMouseEnter}>
              {REACTION_OPTIONS.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    onReact(post.id, type);
                    setShowReactions(false);
                  }}
                  title={type}
                >
                  {REACTION_MAP[type]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="action-btn-fb" onClick={() => onToggleComments(post.id)}>
          💬 Comment
        </button>
        <button className="action-btn-fb">
          ➡️ Share
        </button>
      </div>

      {openComments ? (
        <div className="post-comments-section">
          {commentsLoading ? (
            <p className="muted small">Loading comments...</p>
          ) : (
            <div className="comments-list">
              {nestedComments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  replies={c.replies}
                  onReply={(parentId, body) => onAddComment(post.id, body, parentId)}
                  onDelete={(cid) => onDeleteComment(cid, post.id)}
                  me={me}
                />
              ))}
            </div>
          )}
          <div className="comment-composer">
            <div className="avatar-circle small">
              {me?.avatar ? <img src={resolveBackendUrl(me.avatar)} alt="Me" /> : me?.display_name[0]}
            </div>
            <input
              value={commentDrafts[post.id] || ""}
              onChange={(event) => onCommentDraftChange(post.id, event.target.value)}
              placeholder="Write a comment..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAddComment(post.id);
                }
              }}
            />
            <button className="primary-button" onClick={() => onAddComment(post.id)}>
              Comment
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DirectoryMember({ member, me, onViewProfile }) {
  const isSelf = member.id === me.id;

  return (
    <div className="member-card">
      <div>
        <h3>{member.display_name}</h3>
        <p className="muted">
          {member.email} · User ID: {member.id}
        </p>
      </div>
      <div className="member-actions">
        <button className="ghost-button" onClick={() => onViewProfile(member.id)}>
          {isSelf ? "View my profile" : "View profile"}
        </button>
      </div>
    </div>
  );
}

function ProfilePanel({ 
  selectedProfile, 
  relationships, 
  onSelectProfile, 
  me,
  userPosts,
  userPostsLoading,
  commentsByPost,
  openComments,
  commentsLoading,
  commentDrafts,
  onToggleComments,
  onCommentDraftChange,
  onAddComment,
  onDeleteComment,
  onDeletePost,
  onEditPost,
  onReact,
  onRemoveReaction,
}) {
  return (
    <div className="profile-layout">
      <div className="card profile-header-card">
        <div className="profile-cover"></div>
        <div className="section-title-row">
          {selectedProfile?.id !== me?.id ? (
            <button className="ghost-button" onClick={() => onSelectProfile(me?.id)}>
              Back to my profile
            </button>
          ) : null}
        </div>
        {selectedProfile ? (
          <div className="profile-hero">
            <div className="avatar-circle large">
              {selectedProfile.avatar ? (
                <img src={resolveBackendUrl(selectedProfile.avatar)} alt="Avatar" />
              ) : (
                selectedProfile.display_name[0]
              )}
            </div>
            <div className="profile-info-main">
              <h3>{selectedProfile.display_name}</h3>
              <p className="muted">{selectedProfile.email}</p>
              <p className="bio-text">{selectedProfile.bio || "No bio added yet."}</p>
            </div>
          </div>
        ) : (
          <p className="muted">Choose a member to view profile details.</p>
        )}
      </div>

      <div className="profile-posts-container">
        <div className="section-title-row">
          <h3>Posts by {selectedProfile?.display_name}</h3>
        </div>
        {userPostsLoading ? (
          <div className="card"><p>Loading posts...</p></div>
        ) : userPosts.length > 0 ? (
          <div className="feed-posts">
            {userPosts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                me={me}
                comments={commentsByPost[post.id]}
                openComments={openComments[post.id]}
                commentsLoading={commentsLoading[post.id]}
                commentDrafts={commentDrafts}
                onToggleComments={onToggleComments}
                onCommentDraftChange={onCommentDraftChange}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onDeletePost={onDeletePost}
                onEditPost={onEditPost}
                onReact={onReact}
                onRemoveReaction={onRemoveReaction}
                onViewProfile={onSelectProfile}
              />
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <p className="muted">No posts shared yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({
  me,
  profileEdit,
  setProfileEdit,
  onUpdateMe,
  relationships,
  directory,
  onCreateRelationship,
  onDeleteRelationship,
  onChangePassword,
}) {
  const [activeSubTab, setActiveSubTab] = useState("profile");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const [relSearch, setRelSearch] = useState("");
  const [relDraft, setRelDraft] = useState({ related_user_id: "", relation_type: "father" });

  const filteredDirectory = directory.filter(
    (m) =>
      m.id !== me.id &&
      m.display_name.toLowerCase().includes(relSearch.toLowerCase()) &&
      !relationships.some((r) => r.related_user.id === m.id)
  );

  async function handlePassSubmit(e) {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    try {
      await onChangePassword(oldPass, newPass);
      setPassSuccess("Password updated successfully.");
      setOldPass("");
      setNewPass("");
    } catch (err) {
      setPassError(err.message);
    }
  }

  return (
    <div className="settings-container card">
      <div className="settings-tabs">
        <button className={activeSubTab === "profile" ? "active" : ""} onClick={() => setActiveSubTab("profile")}>
          Profile Update
        </button>
        <button className={activeSubTab === "password" ? "active" : ""} onClick={() => setActiveSubTab("password")}>
          Password Change
        </button>
      </div>

      <div className="settings-content">
        {activeSubTab === "profile" ? (
          <div className="settings-section">
            <h3>Update Profile</h3>
            <form
              className="settings-form"
              onSubmit={onUpdateMe}
            >
              <label>
                <span>Display Name</span>
                <input
                  type="text"
                  value={profileEdit.display_name}
                  onChange={(e) => setProfileEdit({ ...profileEdit, display_name: e.target.value })}
                />
              </label>
              <label>
                <span>Bio</span>
                <textarea
                  value={profileEdit.bio}
                  onChange={(e) => setProfileEdit({ ...profileEdit, bio: e.target.value })}
                />
              </label>
              <label>
                <span>Avatar</span>
                <input
                  type="file"
                  onChange={(e) => setProfileEdit({ ...profileEdit, avatar: e.target.files[0] })}
                  accept="image/*"
                />
              </label>
              <button type="submit" className="primary-button">
                Save Changes
              </button>
            </form>

            <div className="add-relationship-section">
              <h4>Manage Family Connections</h4>
              <div className="relationship-grid">
                {relationships.map((rel) => (
                  <div className="relationship-item-card" key={rel.id}>
                    <div className="rel-details">
                      <strong>{rel.related_user.display_name}</strong>
                      <p className="rel-type-tag">{rel.relation_type}</p>
                    </div>
                    <button className="rel-delete-btn" onClick={() => onDeleteRelationship(rel.id)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className="rel-form-box">
                <div className="search-member-box">
                  <input
                    type="text"
                    placeholder="Search family member to add..."
                    value={relSearch}
                    onChange={(e) => setRelSearch(e.target.value)}
                  />
                  {relSearch && filteredDirectory.length > 0 && (
                    <div className="search-results-popover">
                      {filteredDirectory.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="search-result-item"
                          onClick={() => {
                            setRelDraft({ ...relDraft, related_user_id: m.id });
                            setRelSearch(m.display_name);
                          }}
                        >
                          {m.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={relDraft.relation_type}
                  onChange={(e) => setRelDraft({ ...relDraft, relation_type: e.target.value })}
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  className="primary-button"
                  onClick={() => {
                    if (relDraft.related_user_id) {
                      onCreateRelationship(relDraft);
                      setRelDraft({ related_user_id: "", relation_type: "father" });
                      setRelSearch("");
                    }
                  }}
                  disabled={!relDraft.related_user_id}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeSubTab === "password" ? (
          <div className="settings-section">
            <h3>Change Password</h3>
            <form className="settings-form" onSubmit={handlePassSubmit}>
              <label>
                <span>Old Password</span>
                <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} required />
              </label>
              <label>
                <span>New Password</span>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
              {passError && <div className="alert error">{passError}</div>}
              {passSuccess && <div className="alert success">{passSuccess}</div>}
              <button type="submit" className="primary-button">
                Update Password
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Removed RequestsPanel

function ModerationPanel({ members, onToggleStatus }) {
  return (
    <div className="card">
      <div className="section-title-row">
        <h2>Admin controls</h2>
        <span className="soft-badge">Moderator only</span>
      </div>
      <div className="stack-list">
        {members.map((member) => (
          <div className="member-card" key={member.id}>
            <div>
              <h3>{member.display_name}</h3>
              <p className="muted">{member.email}</p>
            </div>
            <button
              className={member.is_active ? "ghost-button danger" : "primary-button small"}
              onClick={() => onToggleStatus(member.id, !member.is_active)}
            >
              {member.is_active ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [tokens, setTokens] = useState(() => getStoredTokens());
  const [me, setMe] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [feed, setFeed] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [moderationMembers, setModerationMembers] = useState([]);
  const [loginPending, setLoginPending] = useState(false);
  const [registerPending, setRegisterPending] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [composerPending, setComposerPending] = useState(false);
  const [loadingApp, setLoadingApp] = useState(!!tokens?.access);
  const [error, setError] = useState("");
  const [commentsByPost, setCommentsByPost] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [profileEdit, setProfileEdit] = useState({ display_name: "", bio: "", avatar: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [userPosts, setUserPosts] = useState([]);
  const [userPostsLoading, setUserPostsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = useMemo(() => {
    if (me?.is_moderator) {
      return [...NAV_ITEMS, { id: "admin", label: "Admin" }];
    }
    return NAV_ITEMS;
  }, [me]);

  async function bootstrap() {
    try {
      setLoadingApp(true);
      setError("");
      const myProfile = await fetchMe();
      setMe(myProfile);
      setSelectedProfile(myProfile);
      setProfileEdit({ display_name: myProfile.display_name || "", bio: myProfile.bio || "", avatar: null });

      const [feedData, directoryData, relationshipData] = await Promise.all([
        fetchFeed(),
        fetchDirectory(),
        fetchRelationships(myProfile.id),
      ]);

      setFeed(feedData.results || []);
      setDirectory(directoryData.results || []);
      setRelationships(relationshipData.results || relationshipData);

      if (myProfile.is_moderator) {
        const moderatorData = await fetchModerationMembers();
        setModerationMembers(moderatorData.results || []);
      }
    } catch (appError) {
      setError(appError.message);
      // Only redirect to login if it's an authentication error
      if (appError.status === 401 || appError.status === 403) {
        clearTokens();
        setTokens(null);
        setMe(null);
      }
    } finally {
      setLoadingApp(false);
    }
  }

  useEffect(() => {
    if (tokens?.access) {
      const timer = setTimeout(() => {
        void bootstrap();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tokens]);

  async function handleLogin(email, password) {
    try {
      setLoginPending(true);
      setError("");
      const nextTokens = await login(email, password);
      storeTokens(nextTokens);
      setTokens(nextTokens);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoginPending(false);
    }
  }

  async function handleRegister(email, displayName, password) {
    try {
      setRegisterPending(true);
      setError("");
      await register(email, displayName, password);
      // Auto login after registration
      const nextTokens = await login(email, password);
      storeTokens(nextTokens);
      setTokens(nextTokens);
    } catch (regError) {
      setError(regError.message);
    } finally {
      setRegisterPending(false);
    }
  }

  function handleLogout() {
    clearTokens();
    setTokens(null);
    setMe(null);
  }

  async function refreshProfile(userId) {
    try {
      setUserPostsLoading(true);
      const profile = userId === me.id ? me : await fetchUser(userId);
      setSelectedProfile(profile);
      
      const [relationshipData, userPostsData] = await Promise.all([
        fetchRelationships(userId),
        fetchUserPosts(userId)
      ]);
      
      setRelationships(relationshipData.results || relationshipData);
      setUserPosts(userPostsData.results || []);
      setActiveTab("profile");
      setMobileMenuOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUserPostsLoading(false);
    }
  }

  async function handleCreatePost(body, files) {
    try {
      setComposerPending(true);
      const formData = new FormData();
      if (body) {
        formData.append("body", body);
      }
      files.forEach((file) => formData.append("images", file));
      await createPost(formData);
      const feedData = await fetchFeed();
      setFeed(feedData.results || []);
    } catch (postError) {
      setError(postError.message);
    } finally {
      setComposerPending(false);
    }
  }

  async function toggleComments(postId) {
    const isOpen = openComments[postId];
    if (!isOpen && !commentsByPost[postId]) {
      try {
        setCommentsLoading((current) => ({ ...current, [postId]: true }));
        const commentsData = await fetchComments(postId);
        setCommentsByPost((current) => ({ ...current, [postId]: commentsData.results || [] }));
      } catch (commentError) {
        setError(commentError.message);
      } finally {
        setCommentsLoading((current) => ({ ...current, [postId]: false }));
      }
    }
    setOpenComments((current) => ({ ...current, [postId]: !isOpen }));
  }

  async function handleAddComment(postId, manualBody = null, parentId = null) {
    const body = manualBody || commentDrafts[postId]?.trim();
    if (!body) {
      return;
    }
    try {
      await addComment(postId, body, parentId);
      const commentsData = await fetchComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: commentsData.results || [] }));
      if (!manualBody) {
        setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      }
      // Re-fetch feed to update comment counts
      const feedData = await fetchFeed();
      setFeed(feedData.results || []);
    } catch (commentError) {
      setError(commentError.message);
    }
  }

  async function handleDeleteComment(commentId, postId) {
    try {
      await deleteComment(commentId);
      const commentsData = await fetchComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: commentsData.results || [] }));
      const feedData = await fetchFeed();
      setFeed(feedData.results || []);
    } catch (commentError) {
      setError(commentError.message);
    }
  }

  async function handleDeletePost(postId) {
    try {
      await deletePost(postId);
      const feedData = await fetchFeed();
      setFeed(feedData.results || []);
    } catch (postError) {
      setError(postError.message);
    }
  }

  async function handleEditPost(postId, body) {
    const formData = new FormData();
    formData.append("body", body);
    await updatePost(postId, formData);
    const feedData = await fetchFeed();
    setFeed(feedData.results || []);
  }

  async function handleReact(postId, reactionType) {
    try {
      await reactToPost(postId, reactionType);
      const feedData = await fetchFeed();
      setFeed(feedData.results || []);
    } catch (reactionError) {
      setError(reactionError.message);
    }
  }

  async function handleRemoveReaction(postId) {
    try {
      await removeReaction(postId);
      const feedData = await fetchFeed();
      setFeed(feedData.results || []);
    } catch (reactionError) {
      setError(reactionError.message);
    }
  }

  // Handlers for friend requests removed

  async function handleCreateRelationship(payload) {
    try {
      await createRelationship({
        related_user_id: Number(payload.related_user_id),
        relation_type: payload.relation_type,
      });
      const relationshipData = await fetchRelationships(me.id);
      setRelationships(relationshipData.results || relationshipData);
    } catch (relationshipError) {
      setError(relationshipError.message);
    }
  }

  async function handleUpdateRelationship(relationshipId, payload) {
    try {
      await updateRelationship(relationshipId, payload);
      const relationshipData = await fetchRelationships(selectedProfile.id);
      setRelationships(relationshipData.results || relationshipData);
    } catch (relationshipError) {
      setError(relationshipError.message);
    }
  }

  async function handleDeleteRelationship(relationshipId) {
    try {
      await deleteRelationship(relationshipId);
      const relationshipData = await fetchRelationships(selectedProfile.id);
      setRelationships(relationshipData.results || relationshipData);
    } catch (relationshipError) {
      setError(relationshipError.message);
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append("display_name", profileEdit.display_name);
      formData.append("bio", profileEdit.bio);
      if (profileEdit.avatar) {
        formData.append("avatar", profileEdit.avatar);
      }
      const updated = await updateMe(formData);
      setMe(updated);
      setSelectedProfile(updated);
      const directoryData = await fetchDirectory();
      setDirectory(directoryData.results || []);
    } catch (profileError) {
      setError(profileError.message);
    }
  }

  async function handleToggleMemberStatus(userId, isActive) {
    try {
      await updateMemberStatus(userId, isActive);
      const moderatorData = await fetchModerationMembers();
      setModerationMembers(moderatorData.results || []);
      const directoryData = await fetchDirectory();
      setDirectory(directoryData.results || []);
    } catch (moderationError) {
      setError(moderationError.message);
    }
  }

  if (!tokens?.access) {
    if (authMode === "register") {
      return (
        <RegisterScreen
          onRegister={handleRegister}
          onToggleAuth={() => {
            setAuthMode("login");
            setError("");
          }}
          pending={registerPending}
          error={error}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onToggleAuth={() => {
          setAuthMode("register");
          setError("");
        }}
        pending={loginPending}
        error={error}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="top-nav">
        <div className="nav-content">
          <div className="nav-left">
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
            <button className="nav-home-btn" onClick={() => { setActiveTab("feed"); setSearchQuery(""); setMobileMenuOpen(false); }} title="Home Feed">
              🏠
            </button>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search family..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() && activeTab !== "directory") {
                    setActiveTab("directory");
                  }
                }}
              />
            </div>
          </div>
          <div className="nav-right">
            <div 
              className="nav-profile-pill" 
              onClick={() => {
                refreshProfile(me?.id);
              }}
            >
              <div className="avatar-circle small">
                {me?.avatar ? (
                  <img src={resolveBackendUrl(me.avatar)} alt="Me" />
                ) : (
                  me?.display_name ? me.display_name[0] : "?"
                )}
              </div>
              <span>{me?.display_name}</span>
            </div>
            <button className="settings-button-top" onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }} title="Settings">
              ⚙️
            </button>
            <button className="icon-button logout-icon" onClick={handleLogout} title="Logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={`app-shell ${activeTab === "profile" ? "profile-mode" : ""}`}>
        <aside className={`sidebar-left ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-close-row">
            <button onClick={() => setMobileMenuOpen(false)}>✕ Close Menu</button>
          </div>
          <nav className="side-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={item.id === activeTab ? "nav-item active" : "nav-item"}
                onClick={() => { 
                  if (item.id === "profile") {
                    refreshProfile(me?.id);
                  } else {
                    setActiveTab(item.id); 
                  }
                  setMobileMenuOpen(false); 
                }}
              >
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {activeTab === "profile" && relationships.length > 0 && (
            <div className="card relationship-sidebar-card">
              <h3>Family Circle</h3>
              <div className="relationship-sidebar-grid">
                {relationships.map((relationship) => (
                  <div 
                    className="rel-sidebar-item" 
                    key={relationship.id}
                    onClick={() => refreshProfile(relationship.related_user.id)}
                  >
                    <div className="avatar-circle xsmall">
                      {relationship.related_user.avatar ? (
                        <img src={resolveBackendUrl(relationship.related_user.avatar)} alt="Avatar" />
                      ) : (
                        relationship.related_user.display_name[0]
                      )}
                    </div>
                    <div className="rel-sidebar-info">
                      <strong>{relationship.related_user.display_name}</strong>
                      <span className="rel-tag-mini">{relationship.relation_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-ad-card">
            <h4>Family Heritage</h4>
            <p>Explore your family tree and preserve your legacy for future generations.</p>
            <button className="ghost-button small">Learn more</button>
          </div>
        </aside>

        <main className="main-feed">
          {error ? <div className="alert error">{error}</div> : null}
          {loadingApp ? (
            <div className="card loading-card">
              <p>Loading your family circle...</p>
            </div>
          ) : null}

          {!loadingApp && activeTab === "feed" ? (
            <div className="feed-container">
              <Composer onSubmit={handleCreatePost} pending={composerPending} />
              <div className="feed-posts">
                {feed.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={post}
                    me={me}
                    comments={commentsByPost[post.id]}
                    openComments={openComments[post.id]}
                    commentsLoading={commentsLoading[post.id]}
                    commentDrafts={commentDrafts}
                    onToggleComments={toggleComments}
                    onCommentDraftChange={(postId, value) =>
                      setCommentDrafts((current) => ({ ...current, [postId]: value }))
                    }
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    onDeletePost={handleDeletePost}
                    onEditPost={handleEditPost}
                    onReact={handleReact}
                    onRemoveReaction={handleRemoveReaction}
                    onViewProfile={refreshProfile}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {!loadingApp && activeTab === "directory" ? (
            <div className="directory-container">
              <div className="card">
                <div className="card-header-row">
                  <h2>Family Members</h2>
                  {searchQuery && <span className="muted small">Showing results for "{searchQuery}"</span>}
                </div>
                <div className="directory-grid">
                  {directory
                    .filter(m => 
                      !searchQuery || 
                      m.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((member) => (
                      <DirectoryMember
                        key={member.id}
                        member={member}
                        me={me}
                        onViewProfile={refreshProfile}
                      />
                    ))}
                </div>
              </div>
            </div>
          ) : null}

          {!loadingApp && activeTab === "settings" ? (
            <SettingsPanel
              me={me}
              profileEdit={profileEdit}
              setProfileEdit={setProfileEdit}
              onUpdateMe={handleProfileSave}
              relationships={relationships}
              directory={directory}
              onCreateRelationship={handleCreateRelationship}
              onDeleteRelationship={handleDeleteRelationship}
              onChangePassword={changePassword}
            />
          ) : null}

          {!loadingApp && activeTab === "profile" ? (
            <div className="profile-container">
              <ProfilePanel
                selectedProfile={selectedProfile}
                relationships={relationships}
                onSelectProfile={refreshProfile}
                me={me}
                userPosts={userPosts}
                userPostsLoading={userPostsLoading}
                commentsByPost={commentsByPost}
                openComments={openComments}
                commentsLoading={commentsLoading}
                commentDrafts={commentDrafts}
                onToggleComments={toggleComments}
                onCommentDraftChange={(postId, value) =>
                  setCommentDrafts((current) => ({ ...current, [postId]: value }))
                }
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                onReact={handleReact}
                onRemoveReaction={handleRemoveReaction}
                onViewProfile={refreshProfile}
              />
            </div>
          ) : null}


          {!loadingApp && activeTab === "admin" && me?.is_moderator ? (
            <ModerationPanel members={moderationMembers} onToggleStatus={handleToggleMemberStatus} />
          ) : null}
        </main>

        <aside className="sidebar-right">
          <div className="card suggested-members-card">
            <h3>New Members</h3>
            <div className="suggested-list">
              {directory.slice(0, 3).map((member) => (
                <div key={member.id} className="suggested-item">
                  <div className="avatar-circle small">{member.display_name ? member.display_name[0] : "?"}</div>
                  <div className="suggested-info">
                    <strong>{member.display_name}</strong>
                    <button className="text-button" onClick={() => refreshProfile(member.id)}>
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar-footer-links">
            <p>&copy; 2026 Chowdhury Family</p>
            <div className="links">
              <span>Privacy</span> · <span>Terms</span> · <span>Help</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
