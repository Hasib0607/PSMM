import type {
  Comment,
  DraftInput,
  HealthStatus,
  PublishResult,
  ReplyResult,
  SocialPlatform,
} from "@/types";

export interface PublishPayload {
  platform: SocialPlatform;
  caption: string;
  hashtags?: string[];
  title?: string;
  description?: string;
  tags?: string[];
  mediaPath?: string;
  scheduledAt?: Date;
}

export interface PublisherInterface {
  readonly platform: SocialPlatform;
  publish(payload: PublishPayload): Promise<PublishResult>;
  fetchComments(platformPostId: string): Promise<Comment[]>;
  replyToComment(commentId: string, text: string): Promise<ReplyResult>;
  healthCheck(): Promise<HealthStatus>;
}

export abstract class BasePublisher implements PublisherInterface {
  abstract readonly platform: SocialPlatform;

  abstract publish(payload: PublishPayload): Promise<PublishResult>;
  abstract fetchComments(platformPostId: string): Promise<Comment[]>;
  abstract replyToComment(commentId: string, text: string): Promise<ReplyResult>;
  abstract healthCheck(): Promise<HealthStatus>;
}

export function createDraftPayload(
  platform: SocialPlatform,
  draft: DraftInput,
): PublishPayload {
  const version = draft.platformVersions[platform];
  return {
    platform,
    caption: version.caption,
    hashtags: version.hashtags,
    title: version.title,
    description: version.description,
    tags: version.tags,
  };
}
