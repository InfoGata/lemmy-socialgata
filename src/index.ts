import { MessageType, UiMessageType } from "./shared";
import Showdown from "showdown";

const markdownConverter = new Showdown.Converter();
const pluginName = "lemmy";
const DEFAULT_INSTANCE = "https://lemmy.ml";
const LEMMY_INSTANCE_KEY = "lemmy_instance";

// Lemmy API types
interface LemmyComment {
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

interface LemmyPerson {
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

interface LemmyCommunity {
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

interface LemmyPost {
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

interface LemmyCounts {
  score: number;
  upvotes: number;
  downvotes: number;
  comments?: number;
  child_count?: number;
}

interface LemmyPostView {
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

interface LemmyCommentView {
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

interface LemmyCommunityView {
  community: LemmyCommunity;
  subscribed: string;
  blocked: boolean;
  counts: {
    subscribers: number;
    posts: number;
    comments: number;
  };
}

interface LemmyPersonView {
  person: LemmyPerson;
  counts: {
    post_count: number;
    comment_count: number;
  };
}

interface GetPostsResponse {
  posts: LemmyPostView[];
  next_page?: string;
}

interface LemmyCommentsResponse {
  comments: LemmyCommentView[];
}

interface GetPostResponse {
  post_view: LemmyPostView;
  community_view: LemmyCommunityView;
}

interface LemmyCommunityResponse {
  community_view: LemmyCommunityView;
}

interface GetPersonDetailsResponse {
  person_view: LemmyPersonView;
  posts: LemmyPostView[];
  comments: LemmyCommentView[];
}

interface LemmyInstance {
  baseurl: string;
  url: string;
  name: string;
  desc: string;
  nsfw: boolean;
  private: boolean;
  open: boolean;
  usage: {
    localPosts: number;
    localComments: number;
    users: {
      total: number;
      activeHalfyear: number;
      activeMonth: number;
    };
  };
  counts: {
    users: number;
    posts: number;
    comments: number;
    communities: number;
    users_active_half_year: number;
    users_active_month: number;
    users_active_week: number;
    users_active_day: number;
  };
  banner?: string;
  icon?: string;
  langs: string[];
  date: string;
  published: number;
  score: number;
}

// State
let currentInstance = localStorage.getItem(LEMMY_INSTANCE_KEY) || DEFAULT_INSTANCE;

const getBaseUrl = (): string => {
  return currentInstance;
};

const getCommentParentId = (comment: LemmyComment): string | undefined => {
  const split = comment.path.split(".");
  split?.shift();

  return split && split.length > 1
    ? split.at(split.length - 2)
    : undefined;
};

const buildCommentTree = (comments: Post[]): Post[] => {
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

const lemmyPostToPost = (postView: LemmyPostView): Post => {
  return {
    title: postView.post.name,
    apiId: postView.post.id.toString(),
    communityName: postView.community.name,
    communityApiId: postView.community.name,
    score: postView.counts.score,
    numOfComments: postView.counts.comments,
    authorApiId: postView.creator.name,
    authorName: postView.creator.name,
    pluginId: pluginName,
    originalUrl: postView.post.ap_id,
    publishedDate: postView.post.published,
    url: postView.post.url,
    thumbnailUrl: postView.post.thumbnail_url,
    authorAvatar: postView.creator.avatar,
    body: postView.post.body,
  };
};

const lemmyCommentToPost = (commentView: LemmyCommentView): Post => {
  return {
    body: markdownConverter.makeHtml(commentView.comment.content),
    authorApiId: commentView.creator.id.toString(),
    authorName: commentView.creator.name,
    authorAvatar: commentView.creator.avatar,
    apiId: commentView.comment.id.toString(),
    pluginId: pluginName,
    score: commentView.counts.score,
    numOfComments: commentView.counts.child_count,
    originalUrl: commentView.comment.ap_id,
    publishedDate: commentView.comment.published,
    parentId: getCommentParentId(commentView.comment),
    comments: [],
  };
};

// Plugin Methods

const getFeed = async (request?: GetFeedRequest): Promise<GetFeedResponse> => {
  let url = getBaseUrl();
  if (request?.instanceId) {
    url = `https://${request.instanceId}`;
  }

  const perPage = 30;
  const page = Number(request?.pageInfo?.page || 1);

  const apiUrl = new URL(`${url}/api/v3/post/list`);
  apiUrl.searchParams.append("type_", "Local");
  apiUrl.searchParams.append("sort", "Active");
  apiUrl.searchParams.append("limit", perPage.toString());
  apiUrl.searchParams.append("page", page.toString());

  const response = await application.networkRequest(apiUrl.toString());
  const json: GetPostsResponse = await response.json();
  const items = json.posts.map(lemmyPostToPost);

  return {
    items,
    pageInfo: {
      page: page,
      nextPage: json.next_page,
      prevPage: page > 1 ? page - 1 : undefined,
    },
  };
};

const getInstances = async (): Promise<GetInstancesResponse> => {
  const url = "https://data.lemmyverse.net/data/instance.full.json";
  const response = await application.networkRequest(url);
  const instances: LemmyInstance[] = await response.json();
  // order by score
  instances.sort((a, b) => b.score - a.score);
  return {
    instances: instances.map((i) => ({
      name: i.name,
      description: i.desc,
      url: i.url,
      apiId: i.baseurl,
      iconUrl: i.icon,
      bannerUrl: i.banner,
      usersCount: i.counts.users,
      postsCount: i.counts.posts,
      commentsCount: i.counts.comments,
    })),
  };
};

const getCommunity = async (
  request: GetCommunityRequest
): Promise<GetCommunityResponse> => {
  const baseUrl = getBaseUrl();
  const perPage = 30;
  const page = Number(request.pageInfo?.page || 1);

  // Get community info
  const communityUrl = new URL(`${baseUrl}/api/v3/community`);
  communityUrl.searchParams.append("name", request.apiId);
  const communityResponse = await application.networkRequest(communityUrl.toString());
  const communityJson: LemmyCommunityResponse = await communityResponse.json();

  // Get posts
  const postsUrl = new URL(`${baseUrl}/api/v3/post/list`);
  postsUrl.searchParams.append("sort", "Active");
  postsUrl.searchParams.append("limit", perPage.toString());
  postsUrl.searchParams.append("page", page.toString());
  postsUrl.searchParams.append("community_name", request.apiId);

  const postsResponse = await application.networkRequest(postsUrl.toString());
  const postsJson: GetPostsResponse = await postsResponse.json();

  return {
    community: {
      apiId: request.apiId,
      name: communityJson.community_view.community.name,
    },
    items: postsJson.posts.map(lemmyPostToPost),
    pageInfo: {
      page: page,
      nextPage: postsJson.next_page,
      prevPage: page > 1 ? page - 1 : undefined,
    },
  };
};

const getComments = async (
  request: GetCommentsRequest
): Promise<GetCommentsResponse> => {
  const baseUrl = getBaseUrl();

  // Get post details
  const postUrl = new URL(`${baseUrl}/api/v3/post`);
  postUrl.searchParams.append("id", request.apiId ?? "");
  const postResponse = await application.networkRequest(postUrl.toString());
  const postJson: GetPostResponse = await postResponse.json();

  // Get comments
  const commentsUrl = new URL(`${baseUrl}/api/v3/comment/list`);
  commentsUrl.searchParams.append("type_", "All");
  commentsUrl.searchParams.append("post_id", request.apiId ?? "");
  commentsUrl.searchParams.append("sort", "Hot");
  commentsUrl.searchParams.append("max_depth", "8");

  const commentsResponse = await application.networkRequest(commentsUrl.toString());
  const commentsJson: LemmyCommentsResponse = await commentsResponse.json();

  const posts = commentsJson.comments.map(lemmyCommentToPost);
  const items = buildCommentTree(posts);

  return {
    items,
    post: lemmyPostToPost(postJson.post_view),
    community: {
      apiId: request.communityId || "",
      name: postJson.community_view.community.name,
    },
  };
};

const getUser = async (request: GetUserRequest): Promise<GetUserResponse> => {
  const baseUrl = getBaseUrl();
  const perPage = 30;
  const page = 1;

  const userUrl = new URL(`${baseUrl}/api/v3/user`);
  userUrl.searchParams.append("username", request.apiId);
  userUrl.searchParams.append("limit", perPage.toString());
  userUrl.searchParams.append("page", page.toString());
  userUrl.searchParams.append("sort", "New");

  const userResponse = await application.networkRequest(userUrl.toString());
  const userJson: GetPersonDetailsResponse = await userResponse.json();

  return {
    user: {
      apiId: request.apiId,
      name: userJson.person_view.person.name,
    },
    items: userJson.posts.map(lemmyPostToPost),
  };
};

const search = async (request: SearchRequest): Promise<SearchResponse> => {
  const baseUrl = getBaseUrl();
  const page = Number(request.pageInfo?.page || 1);

  const searchUrl = new URL(`${baseUrl}/api/v3/search`);
  searchUrl.searchParams.append("q", request.query);
  searchUrl.searchParams.append("type_", "Posts");
  searchUrl.searchParams.append("sort", "TopAll");
  searchUrl.searchParams.append("page", page.toString());
  searchUrl.searchParams.append("limit", "30");

  const response = await application.networkRequest(searchUrl.toString());
  const json: { posts: LemmyPostView[] } = await response.json();

  return {
    items: json.posts.map(lemmyPostToPost),
    pageInfo: {
      page: page,
      nextPage: json.posts.length === 30 ? page + 1 : undefined,
      prevPage: page > 1 ? page - 1 : undefined,
    },
  };
};

// UI Message handling
const sendMessage = (message: MessageType) => {
  application.postUiMessage(message);
};

const getInfo = async () => {
  const instance = localStorage.getItem(LEMMY_INSTANCE_KEY) || DEFAULT_INSTANCE;
  sendMessage({
    type: "info",
    instance,
  });
};

// Theme handling
const changeTheme = (theme: Theme) => {
  localStorage.setItem("vite-ui-theme", theme);
};

// Initialize plugin
const init = async () => {
  const instance = localStorage.getItem(LEMMY_INSTANCE_KEY);
  if (instance) {
    currentInstance = instance;
  }

  const theme = await application.getTheme();
  changeTheme(theme);
};

// Wire up plugin handlers
application.onGetFeed = getFeed;
application.onGetInstances = getInstances;
application.onGetCommunity = getCommunity;
application.onGetComments = getComments;
application.onGetUser = getUser;
application.onSearch = search;
application.onGetPlatformType = async () => "forum";

application.onUiMessage = async (message: UiMessageType) => {
  switch (message.type) {
    case "check-info":
      getInfo();
      break;
    case "save":
      let instance = message.instance.trim();
      // Ensure instance has https:// prefix
      if (instance && !instance.startsWith("http://") && !instance.startsWith("https://")) {
        instance = `https://${instance}`;
      }
      localStorage.setItem(LEMMY_INSTANCE_KEY, instance || DEFAULT_INSTANCE);
      currentInstance = instance || DEFAULT_INSTANCE;
      application.createNotification({ message: "Settings saved!" });
      break;
    default:
      const _exhaustive: never = message;
      break;
  }
};

application.onChangeTheme = async (theme: Theme) => {
  changeTheme(theme);
};

application.onPostLogin = init;
init();
