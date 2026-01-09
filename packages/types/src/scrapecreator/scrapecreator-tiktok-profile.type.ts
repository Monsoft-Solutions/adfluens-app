/**
 * ScrapeCreator TikTok Profile API Response Types
 *
 * Types for the TikTok profile endpoint from the ScrapeCreator API.
 * These types represent the raw API response structure.
 *
 * @see https://api.scrapecreators.com/v1/tiktok/profile
 * @module @repo/types/scrapecreator/scrapecreator-tiktok-profile
 */

/**
 * Commerce user info from TikTok profile
 */
export type ScrapecreatorTiktokCommerceUserInfo = {
  /** Whether user is a commerce user */
  commerceUser?: boolean;

  /** Business category */
  category?: string;

  /** Whether category button is shown */
  categoryButton?: boolean;
};

/**
 * Profile tab settings from TikTok profile
 */
export type ScrapecreatorTiktokProfileTab = {
  /** Show music tab */
  showMusicTab?: boolean;

  /** Show question tab */
  showQuestionTab?: boolean;

  /** Show playlist tab */
  showPlayListTab?: boolean;
};

/**
 * User data from ScrapeCreator TikTok API
 */
export type ScrapecreatorTiktokUser = {
  /** TikTok user ID */
  id: string;

  /** Short ID (may be empty) */
  shortId?: string;

  /** Unique username/handle */
  uniqueId: string;

  /** Display nickname */
  nickname: string;

  /** Large avatar URL */
  avatarLarger?: string;

  /** Medium avatar URL */
  avatarMedium?: string;

  /** Thumbnail avatar URL */
  avatarThumb?: string;

  /** Bio/signature text */
  signature?: string;

  /** Account creation timestamp (Unix) */
  createTime?: number;

  /** Whether account is verified */
  verified?: boolean;

  /** Secure user ID */
  secUid?: string;

  /** FTC compliance flag */
  ftc?: boolean;

  /** Relation status */
  relation?: number;

  /** Whether favorites are open */
  openFavorite?: boolean;

  /** Comment setting */
  commentSetting?: number;

  /** Commerce user information */
  commerceUserInfo?: ScrapecreatorTiktokCommerceUserInfo;

  /** Duet setting */
  duetSetting?: number;

  /** Stitch setting */
  stitchSetting?: number;

  /** Whether account is private */
  privateAccount?: boolean;

  /** Whether account is secret */
  secret?: boolean;

  /** Whether this is an AD virtual account */
  isADVirtual?: boolean;

  /** Live room ID */
  roomId?: string;

  /** Unique ID modify timestamp */
  uniqueIdModifyTime?: number;

  /** Whether user is a TikTok seller */
  ttSeller?: boolean;

  /** Download setting */
  downloadSetting?: number;

  /** Profile tab settings */
  profileTab?: ScrapecreatorTiktokProfileTab;

  /** Following visibility setting */
  followingVisibility?: number;

  /** Recommend reason text */
  recommendReason?: string;

  /** Now invitation card URL */
  nowInvitationCardUrl?: string;

  /** Nickname modify timestamp */
  nickNameModifyTime?: number;

  /** Whether embed is banned */
  isEmbedBanned?: boolean;

  /** Can expand playlist */
  canExpPlaylist?: boolean;

  /** Profile embed permission */
  profileEmbedPermission?: number;

  /** User language */
  language?: string;

  /** Event list */
  eventList?: unknown[];

  /** Suggest account bind */
  suggestAccountBind?: boolean;

  /** Whether user is an organization (0 or 1) */
  isOrganization?: number;

  /** User story status */
  UserStoryStatus?: number;
};

/**
 * Stats data from ScrapeCreator TikTok API
 */
export type ScrapecreatorTiktokStats = {
  /** Follower count */
  followerCount: number;

  /** Following count */
  followingCount: number;

  /** Total hearts/likes (legacy) */
  heart: number;

  /** Total hearts/likes count */
  heartCount: number;

  /** Total video count */
  videoCount: number;

  /** Total digg count */
  diggCount: number;

  /** Friend count */
  friendCount: number;
};

/**
 * Stats V2 data (string format) from ScrapeCreator TikTok API
 */
export type ScrapecreatorTiktokStatsV2 = {
  /** Follower count as string */
  followerCount: string;

  /** Following count as string */
  followingCount: string;

  /** Total hearts as string */
  heart: string;

  /** Total hearts count as string */
  heartCount: string;

  /** Total video count as string */
  videoCount: string;

  /** Total digg count as string */
  diggCount: string;

  /** Friend count as string */
  friendCount: string;
};

/**
 * ScrapeCreator TikTok profile API response
 *
 * The complete response from the /v1/tiktok/profile endpoint.
 */
export type ScrapecreatorTiktokProfileResponse = {
  /** Whether the API request was successful */
  success: boolean;

  /** Remaining API credits */
  credits_remaining?: number;

  /** User profile data */
  user: ScrapecreatorTiktokUser;

  /** Stats data (numeric) */
  stats: ScrapecreatorTiktokStats;

  /** Stats data V2 (string format) */
  statsV2?: ScrapecreatorTiktokStatsV2;

  /** List of user's items/videos */
  itemList?: unknown[];
};
