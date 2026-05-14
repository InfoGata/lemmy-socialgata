import MarkdownIt from "markdown-it";

export const markdownConverter = new MarkdownIt();

export interface LemmyComment {
  id: number;
  creator_id: number;
  post_id: number;
  content: string;
  removed: boolean;
  published: string;
  updated?: string;
  deleted: boolean;
  ap_id: string;
  local: boolean;
  path: string;
  distinguished: boolean;
  language_id: number;
}

export interface LemmyPerson {
  id: number;
  name: string;
  display_name?: string;
  avatar?: string;
  banned: boolean;
  published: string;
  updated?: string;
  actor_id: string;
  bio?: string;
  local: boolean;
  banner?: string;
  deleted: boolean;
  matrix_user_id?: string;
  bot_account: boolean;
  ban_expires?: string;
  instance_id: number;
}

export interface LemmyCommunity {
  id: number;
  name: string;
  title: string;
  description?: string;
  removed: boolean;
  published: string;
  updated?: string;
  deleted: boolean;
  nsfw: boolean;
  actor_id: string;
  local: boolean;
  icon?: string;
  banner?: string;
  hidden: boolean;
  posting_restricted_to_mods: boolean;
  instance_id: number;
}

export interface LemmyPost {
  id: number;
  name: string;
  url?: string;
  body?: string;
  creator_id: number;
  community_id: number;
  removed: boolean;
  locked: boolean;
  published: string;
  updated?: string;
  deleted: boolean;
  nsfw: boolean;
  embed_title?: string;
  embed_description?: string;
  thumbnail_url?: string;
  ap_id: string;
  local: boolean;
  embed_video_url?: string;
  language_id: number;
  featured_community: boolean;
  featured_local: boolean;
}

export interface LemmyCounts {
  score: number;
  upvotes: number;
  downvotes: number;
  comments?: number;
  child_count?: number;
}

export interface LemmyPostView {
  post: LemmyPost;
  creator: LemmyPerson;
  community: LemmyCommunity;
  counts: LemmyCounts;
  creator_banned_from_community: boolean;
  subscribed: string;
  saved: boolean;
  read: boolean;
  creator_blocked: boolean;
  unread_comments: number;
}

export interface LemmyCommentView {
  comment: LemmyComment;
  creator: LemmyPerson;
  post: LemmyPost;
  community: LemmyCommunity;
  counts: LemmyCounts;
  creator_banned_from_community: boolean;
  subscribed: string;
  saved: boolean;
  creator_blocked: boolean;
}

export const getCommentParentId = (
  comment: LemmyComment
): string | undefined => {
  const split = comment.path.split(".");
  split?.shift();

  return split && split.length > 1 ? split.at(split.length - 2) : undefined;
};

export const buildCommentTree = (comments: Post[]): Post[] => {
  const map = new Map<string, Post>();
  for (const comment of comments) {
    if (comment.apiId) {
      map.set(comment.apiId, comment);
    }
  }
  const result: Post[] = [];
  for (const comment of comments) {
    if (comment.apiId) {
      const child = map.get(comment.apiId);
      const parentId = child?.parentId;
      if (parentId) {
        const parent = map.get(parentId);
        if (parent) {
          parent.comments?.push(comment);
        }
      } else {
        result.push(comment);
      }
    }
  }
  return result;
};

export const lemmyPostToPost = (postView: LemmyPostView): Post => {
  return {
    title: postView.post.name,
    apiId: postView.post.id.toString(),
    communityName: postView.community.name,
    communityApiId: postView.community.name,
    score: postView.counts.score,
    numOfComments: postView.counts.comments,
    authorApiId: postView.creator.name,
    authorName: postView.creator.name,
    originalUrl: postView.post.ap_id,
    publishedDate: postView.post.published,
    url: postView.post.url,
    thumbnailUrl: postView.post.thumbnail_url,
    authorAvatar: postView.creator.avatar,
    body: postView.post.body,
  };
};

export const lemmyCommentToPost = (commentView: LemmyCommentView): Post => {
  return {
    body: markdownConverter.render(commentView.comment.content),
    authorApiId: commentView.creator.id.toString(),
    authorName: commentView.creator.name,
    authorAvatar: commentView.creator.avatar,
    apiId: commentView.comment.id.toString(),
    score: commentView.counts.score,
    numOfComments: commentView.counts.child_count,
    originalUrl: commentView.comment.ap_id,
    publishedDate: commentView.comment.published,
    parentId: getCommentParentId(commentView.comment),
    comments: [],
  };
};
