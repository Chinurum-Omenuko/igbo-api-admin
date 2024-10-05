import { getAuth, updateProfile, User } from 'firebase/auth';
import { camelCase, pick } from 'lodash';
import network from 'src/Core/Dashboard/network';
import { UserProfile } from 'src/backend/controllers/utils/interfaces';
import DialectEnum from 'src/backend/shared/constants/DialectEnum';
import StatTypes from 'src/backend/shared/constants/StatTypes';
import Collection from './constants/Collection';
import { request } from './utils/request';

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data: result } = await request({
    method: 'GET',
    url: `${Collection.USERS}/${userId}`,
  });
  return result;
};

export const updateUserProfile = async ({
  userProfile,
}: {
  userProfile: Partial<{
    displayName: string;
    age: Date;
    dialects: DialectEnum[];
  }>;
}): Promise<User> => {
  const auth = getAuth();
  const firebaseProfile = pick(userProfile, ['displayName']);
  await updateProfile(auth.currentUser, firebaseProfile);

  return auth.currentUser;
};

export const getUserStats = async (): Promise<{ [key: string]: number }> => {
  const { body } = await network('/stats/full');
  const parsedBody: { [key in StatTypes]: { value: number } } = JSON.parse(body);

  const stats = Object.entries(parsedBody).reduce(
    (finalStats, [key, value]) => ({
      ...finalStats,
      [camelCase(key)]: value.value,
    }),
    {} as { [key: string]: number },
  );
  return stats;
};

// User Stats on Profile

export const getUserExampleSuggestionRecordings = async (uid: string): Promise<{ [key: string]: number }> => {
  const { data: result } = await request<{ timestampedExampleSuggestions: { [key: string]: number } }>({
    method: 'GET',
    url: `${Collection.STATS}/users/${uid}/${Collection.EXAMPLE_SUGGESTIONS}/recorded`,
    params: { uid },
  });
  return result.timestampedExampleSuggestions;
};

export const getUserExampleSuggestionTranslations = async (uid: string): Promise<{ [key: string]: number }> => {
  const { data: result } = await request<{ timestampedExampleSuggestions: { [key: string]: number } }>({
    method: 'GET',
    url: `${Collection.STATS}/users/${uid}/${Collection.EXAMPLE_SUGGESTIONS}/translated`,
    params: { uid },
  });
  return result.timestampedExampleSuggestions;
};
