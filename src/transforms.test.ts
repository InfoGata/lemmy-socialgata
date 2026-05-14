import { describe, expect, it } from "vitest";
import {
  buildCommentTree,
  getCommentParentId,
  LemmyComment,
  LemmyCommentView,
  LemmyPostView,
  lemmyCommentToPost,
  lemmyPostToPost,
} from "./transforms";

const makePostView = (
  overrides: Partial<{
    postId: number;
    title: string;
    body?: string;
    communityName: string;
    creatorName: string;
    score: number;
    comments?: number;
    apId: string;
    published: string;
    url?: string;
    thumbnailUrl?: string;
    avatar?: string;
  }> = {}
): LemmyPostView => {
  const o = {
    postId: 42,
    title: "Hello world",
    communityName: "rust",
    creatorName: "alice",
    score: 10,
    comments: 3,
    apId: "https://lemmy.ml/post/42",
    published: "2025-01-01T00:00:00Z",
    ...overrides,
  };
  return {
    post: {
      id: o.postId,
      name: o.title,
      body: o.body,
      url: o.url,
      thumbnail_url: o.thumbnailUrl,
      ap_id: o.apId,
      published: o.published,
    },
    creator: {
      name: o.creatorName,
      avatar: o.avatar,
    },
    community: { name: o.communityName },
    counts: { score: o.score, comments: o.comments },
  } as unknown as LemmyPostView;
};

const makeCommentView = (
  overrides: Partial<{
    commentId: number;
    content: string;
    path: string;
    apId: string;
    published: string;
    creatorId: number;
    creatorName: string;
    avatar?: string;
    score: number;
    childCount?: number;
  }> = {}
): LemmyCommentView => {
  const o = {
    commentId: 1,
    content: "hello",
    path: "0.1",
    apId: "https://lemmy.ml/comment/1",
    published: "2025-01-01T00:00:00Z",
    creatorId: 99,
    creatorName: "bob",
    score: 7,
    childCount: 0,
    ...overrides,
  };
  return {
    comment: {
      id: o.commentId,
      content: o.content,
      path: o.path,
      ap_id: o.apId,
      published: o.published,
    },
    creator: {
      id: o.creatorId,
      name: o.creatorName,
      avatar: o.avatar,
    },
    counts: { score: o.score, child_count: o.childCount },
  } as unknown as LemmyCommentView;
};

describe("getCommentParentId", () => {
  it("returns undefined for a top-level comment", () => {
    const comment = { path: "0.1" } as LemmyComment;
    expect(getCommentParentId(comment)).toBeUndefined();
  });

  it("returns the immediate parent id for a nested comment", () => {
    const comment = { path: "0.1.5.12" } as LemmyComment;
    expect(getCommentParentId(comment)).toBe("5");
  });

  it("returns the parent id for a depth-2 comment", () => {
    const comment = { path: "0.1.2" } as LemmyComment;
    expect(getCommentParentId(comment)).toBe("1");
  });
});

describe("lemmyCommentToPost", () => {
  it("renders markdown content into HTML in the body", () => {
    const view = makeCommentView({
      content: "Hello **world** and [link](https://example.com)",
    });
    const post = lemmyCommentToPost(view);

    expect(post.body).toContain("<strong>world</strong>");
    expect(post.body).toContain('<a href="https://example.com">link</a>');
    expect(post.body).toMatch(/^<p>/);
  });

  it("maps comment and creator fields onto the Post shape", () => {
    const view = makeCommentView({
      commentId: 123,
      creatorId: 99,
      creatorName: "bob",
      avatar: "https://example.com/avatar.png",
      score: 42,
      childCount: 5,
      apId: "https://lemmy.ml/comment/123",
      published: "2025-02-03T04:05:06Z",
      content: "plain text",
    });

    const post = lemmyCommentToPost(view);

    expect(post.apiId).toBe("123");
    expect(post.authorApiId).toBe("99");
    expect(post.authorName).toBe("bob");
    expect(post.authorAvatar).toBe("https://example.com/avatar.png");
    expect(post.score).toBe(42);
    expect(post.numOfComments).toBe(5);
    expect(post.originalUrl).toBe("https://lemmy.ml/comment/123");
    expect(post.publishedDate).toBe("2025-02-03T04:05:06Z");
    expect(post.comments).toEqual([]);
  });

  it("derives parentId from the comment path", () => {
    const root = lemmyCommentToPost(makeCommentView({ path: "0.10" }));
    const nested = lemmyCommentToPost(makeCommentView({ path: "0.10.20.30" }));

    expect(root.parentId).toBeUndefined();
    expect(nested.parentId).toBe("20");
  });
});

describe("lemmyPostToPost", () => {
  it("maps post fields onto the Post shape", () => {
    const view = makePostView({
      postId: 7,
      title: "A title",
      body: "raw markdown body",
      communityName: "rust",
      creatorName: "alice",
      score: 11,
      comments: 4,
      apId: "https://lemmy.ml/post/7",
      published: "2025-03-04T00:00:00Z",
      url: "https://example.com/article",
      thumbnailUrl: "https://example.com/thumb.png",
      avatar: "https://example.com/alice.png",
    });

    const post = lemmyPostToPost(view);

    expect(post.title).toBe("A title");
    expect(post.apiId).toBe("7");
    expect(post.communityName).toBe("rust");
    expect(post.communityApiId).toBe("rust");
    expect(post.authorName).toBe("alice");
    expect(post.authorApiId).toBe("alice");
    expect(post.authorAvatar).toBe("https://example.com/alice.png");
    expect(post.score).toBe(11);
    expect(post.numOfComments).toBe(4);
    expect(post.originalUrl).toBe("https://lemmy.ml/post/7");
    expect(post.publishedDate).toBe("2025-03-04T00:00:00Z");
    expect(post.url).toBe("https://example.com/article");
    expect(post.thumbnailUrl).toBe("https://example.com/thumb.png");
  });

  it("does not render markdown in the post body (kept raw)", () => {
    const view = makePostView({ body: "**not bold**" });
    const post = lemmyPostToPost(view);
    expect(post.body).toBe("**not bold**");
  });
});

describe("buildCommentTree", () => {
  it("returns root comments unchanged when there are no replies", () => {
    const a: Post = { apiId: "1", comments: [] };
    const b: Post = { apiId: "2", comments: [] };

    const tree = buildCommentTree([a, b]);

    expect(tree).toHaveLength(2);
    expect(tree.map((c) => c.apiId)).toEqual(["1", "2"]);
  });

  it("nests replies under their parent and excludes them from the root", () => {
    const root: Post = { apiId: "1", comments: [] };
    const reply: Post = { apiId: "2", parentId: "1", comments: [] };
    const nested: Post = { apiId: "3", parentId: "2", comments: [] };

    const tree = buildCommentTree([root, reply, nested]);

    expect(tree).toHaveLength(1);
    expect(tree[0].apiId).toBe("1");
    expect(tree[0].comments).toHaveLength(1);
    expect(tree[0].comments?.[0].apiId).toBe("2");
    expect(tree[0].comments?.[0].comments).toHaveLength(1);
    expect(tree[0].comments?.[0].comments?.[0].apiId).toBe("3");
  });

  it("treats a reply whose parent is missing as a root", () => {
    const orphan: Post = { apiId: "2", parentId: "missing", comments: [] };

    const tree = buildCommentTree([orphan]);

    // parent lookup fails, so the orphan is neither attached nor included
    expect(tree).toHaveLength(0);
  });
});
