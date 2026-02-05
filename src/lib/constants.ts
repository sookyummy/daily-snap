export const APP_NAME = "Stichy";
export const MAX_NICKNAME_LENGTH = 16;
export const MIN_NICKNAME_LENGTH = 2;
export const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣_]+$/;
export const MAX_GROUP_NAME_LENGTH = 20;
export const MIN_GROUP_MEMBERS = 2;
export const MAX_GROUP_MEMBERS = 8;
export const INVITE_EXPIRY_HOURS = 48;
export const MAX_PHOTO_SIZE_MB = 10;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const PHOTO_MAX_DIMENSION = 1920;
export const THUMBNAIL_SIZE = 300;
export const COLLAGE_SIZE = 1080;
export const MISSION_START_HOUR_KST = 10;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
];
