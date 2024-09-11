import React, { ReactElement } from 'react';
import { Avatar, Box, Heading, Link, Text, Tooltip, chakra, useToast, useBreakpointValue } from '@chakra-ui/react';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import { usePermissions } from 'react-admin';
import { FormattedUser } from 'src/backend/controllers/utils/interfaces';
import copyToClipboard from 'src/shared/utils/copyToClipboard';
import { hasAdminPermissions } from 'src/shared/utils/permissions';
import Gender from 'src/backend/shared/constants/Gender';
import DialectEnum from 'src/backend/shared/constants/DialectEnum';
import { UserProjectPermissionContext } from 'src/App/contexts/UserProjectPermissionContext';

const UserCard = ({
  displayName,
  photoURL,
  email,
}: Partial<FormattedUser> & {
  age: number;
  dialects: DialectEnum[];
}): ReactElement => {
  const permissions = usePermissions();
  const userProjectPermission = React.useContext(UserProjectPermissionContext);
  const toast = useToast();
  const isAdmin = hasAdminPermissions(permissions.permissions, true);
  const avatarSize = useBreakpointValue({ base: 'lg', lg: 'xl' });

  const handleCopyId = () => {
    copyToClipboard(
      {
        copyText: email,
        successMessage: `${displayName}'s email has been copied to your clipboard`,
      },
      toast,
    );
  };

  return (
    <Box className="flex flex-col md:flex-row items-center text-center md:text-left space-y-4 md:space-x-4 mb-4 p-6">
      <Avatar name={displayName} src={photoURL} size={avatarSize} />
      <Box>
        <Heading className={!displayName ? 'text-gray-500' : ''} fontSize={{ base: '2xl', lg: '3xl' }}>
          {displayName || 'No display name'}
        </Heading>
        <Box className="my-2">
          <Box className="flex flex-col lg:flex-row lg:items-center lg:space-x-3">
            <Text fontFamily="heading" textAlign="left">
              <chakra.span mr={1} fontWeight="bold">
                Gender:
              </chakra.span>
              {(Gender[userProjectPermission?.gender]?.value !== 'UNSPECIFIED' &&
                Gender[userProjectPermission?.gender]?.label) || (
                <chakra.span fontStyle="italic" color="gray.400">
                  Not selected
                </chakra.span>
              )}
            </Text>
          </Box>
        </Box>
        <Box className="flex flex-row space-x-2">
          <Link color="green" href={`mailto:${email}`}>
            {email}
          </Link>
          {isAdmin ? (
            <Tooltip label={`Copy ${displayName}'s email`}>
              <FileCopyIcon className="cursor-pointer" style={{ height: 20 }} onClick={handleCopyId} />
            </Tooltip>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

export default UserCard;
