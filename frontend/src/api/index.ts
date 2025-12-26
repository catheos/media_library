export { api, ApiException } from './client';
export { userService } from './services/users';
export { mediaService } from './services/media';
export { characterService } from './services/characters';
export { mediaCharacterService } from './services/media-character';

export type {
  User,
  LoginResponse,
  RegisterResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './services/users';

export type {
  MediaType,
  MediaStatus,
  Media,
  PaginatedResponse,
  CreateMediaRequest,
  CreateMediaResponse,
  UpdateMediaRequest,
  UpdateMediaResponse,
} from './services/media';

export type {
  Character,
  CharacterListResponse,
  CharacterMedia,
  CharacterMediaListResponse,
  CreateCharacterRequest,
  CreateCharacterResponse,
  UpdateCharacterRequest,
  UpdateCharacterResponse,
} from './services/characters';

export type {
  MediaCharacterRole,
  MediaCharacter,
  MediaCharactersResponse,
  CreateMediaCharacterResponse,
  UpdateMediaCharacterResponse,
  DeleteMediaCharacterResponse,
} from './services/media-character'