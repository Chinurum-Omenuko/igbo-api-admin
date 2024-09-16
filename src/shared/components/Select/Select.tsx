import React, { ReactElement, useState } from 'react';
import { compact, flatten, get, omit } from 'lodash';
import pluralize from 'pluralize';
import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Tooltip,
  useToast,
  IconButton,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { FiEye, FiEdit3 } from 'react-icons/fi';
import { LuMoreHorizontal, LuMoreVertical } from 'react-icons/lu';
import { AddIcon, AtSignIcon, CheckCircleIcon, DeleteIcon, NotAllowedIcon, ViewIcon } from '@chakra-ui/icons';
import { MergeType, Link as LinkIcon } from '@mui/icons-material';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import useFirebaseUid from 'src/hooks/useFirebaseUid';
import ActionTypes from 'src/shared/constants/ActionTypes';
import { hasAdminOrMergerPermissions, hasAdminPermissions } from 'src/shared/utils/permissions';
import { determineCreateSuggestionRedirection } from 'src/shared/utils';
import actionsMap from 'src/shared/constants/actionsMap';
import Collection from 'src/shared/constants/Collection';
import Requirements from 'src/backend/shared/constants/Requirements';
import { TWITTER_APP_URL } from 'src/Core/constants';
import UserRoles from 'src/backend/shared/constants/UserRoles';
import copyToClipboard from 'src/shared/utils/copyToClipboard';
import RolesDrawer from 'src/shared/components/Select/components/RolesDrawer';
import Confirmation from '../Confirmation';
import SelectInterface from './SelectInterface';

const Select = ({
  collection,
  record = { id: '', merged: null },
  permissions,
  resource = '',
  push,
  view,
  showButtonLabels,
}: SelectInterface): ReactElement => {
  const [value, setValue] = useState(null);
  const [action, setAction] = useState(null);
  const [uid, setUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  /* Required to determine when to render the confirmation model */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const toast = useToast();
  const { isOpen, onClose, onOpen } = useDisclosure();
  useFirebaseUid(setUid);
  const hasEnoughApprovals =
    resource !== Collection.WORD_SUGGESTIONS ||
    (record?.approvals?.length || 0) >= Requirements.MINIMUM_REQUIRED_APPROVALS;

  const clearConfirmOpen = () => {
    setIsConfirmOpen(false);
  };

  const withConfirm = (value: any) => {
    setIsConfirmOpen(true);
    return value;
  };

  const userCollectionOptions = [{ value: 'roles', label: 'Change role', onSelect: onOpen }];

  const suggestionCollectionOptions = compact(
    flatten([
      hasAdminOrMergerPermissions(
        permissions,
        record.merged
          ? null
          : [
              {
                value: 'merge',
                label: (() => (
                  <span>
                    <MergeType className="-ml-1 mr-0" />
                    Merge
                  </span>
                ))(),
                onSelect: () => withConfirm(setAction(actionsMap.Merge)),
                props: {
                  isDisabled: !hasEnoughApprovals,
                  tooltipMessage: !hasEnoughApprovals
                    ? `You are unable to merge this document until there 
            are at least ${pluralize('approval', Requirements.MINIMUM_REQUIRED_APPROVALS, true)} `
                    : '',
                },
              },
            ],
      ),
      record.merged
        ? null
        : [
            {
              value: 'approve',
              label: (() => (
                <span className="text-green-500">
                  <CheckCircleIcon className="mr-2" />
                  {record?.approvals?.includes(uid) ? 'Approved' : 'Approve'}
                </span>
              ))(),
              onSelect: () => withConfirm(setAction(actionsMap.Approve)),
            },
            {
              value: 'deny',
              label: (() => (
                <span className="text-yellow-800">
                  <NotAllowedIcon className="mr-2" />
                  {record?.denials?.includes(uid) ? 'Denied' : 'Deny'}
                </span>
              ))(),
              onSelect: () => withConfirm(setAction(actionsMap.Deny)),
            },
            {
              value: 'notify',
              label: (() => (
                <span>
                  <AtSignIcon className="mr-2" />
                  Notify Editors
                </span>
              ))(),
              onSelect: () => withConfirm(setAction(actionsMap.Notify)),
            },
          ],
      hasAdminOrMergerPermissions(
        permissions,
        record.merged
          ? null
          : [
              {
                value: 'delete',
                label: (() => (
                  <span className="text-red-500">
                    <DeleteIcon className="mr-2" />
                    Delete
                  </span>
                ))(),
                onSelect: () => withConfirm(setAction(actionsMap.Delete)),
              },
            ],
      ),
    ]),
  );

  const mergedCollectionOptions = compact(
    flatten([
      hasAdminPermissions(
        permissions,
        resource === Collection.WORDS
          ? [
              {
                value: 'combineWord',
                label: 'Combine Word Into...',
                onSelect: () => withConfirm(setAction(actionsMap.Combine)),
              },
            ]
          : null,
      ),
      hasAdminOrMergerPermissions(
        permissions,
        resource !== Collection.NSIBIDI_CHARACTERS
          ? {
              value: 'requestDelete',
              label: (() => (
                <span className="text-red-500">
                  <DeleteIcon className="mr-2" />
                  {`Request to Delete ${
                    resource === Collection.WORDS
                      ? 'Word'
                      : resource === Collection.EXAMPLES
                      ? 'Example'
                      : resource === Collection.CORPORA
                      ? 'Corpus'
                      : resource === Collection.TEXT_IMAGES
                      ? 'Text Image'
                      : ''
                  }`}
                </span>
              ))(),
              onSelect: () => withConfirm(setAction(actionsMap[ActionTypes.REQUEST_DELETE])),
            }
          : null,
      ),
      hasAdminPermissions(
        permissions,
        resource === Collection.NSIBIDI_CHARACTERS
          ? {
              value: 'delete',
              label: (() => (
                <span className="text-red-500">
                  <DeleteIcon className="mr-2" />
                  Delete Nsịbịdị character
                </span>
              ))(),
              onSelect: () => withConfirm(setAction(actionsMap[ActionTypes.DELETE])),
            }
          : null,
      ),
    ]),
  );

  const pollCollectionOptions = [
    {
      value: 'createConstructedTerm',
      label: (() => (
        <span>
          <AddIcon className="mr-2" />
          Create Constructed Term
        </span>
      ))(),
      onSelect: ({ push }) =>
        determineCreateSuggestionRedirection({
          record: {
            id: 'default',
            word: get(record, 'igboWord'),
            attributes: {
              isConstructedTerm: true,
            },
            twitterPollId: (get(record, 'id') as string) || '',
            examples: [],
          },
          resource: Collection.POLLS,
          push,
        }),
    },
    {
      value: 'viewPoll',
      label: (() => (
        <span>
          <ViewIcon className="mr-2" />
          Go to Tweet
        </span>
      ))(),
      onSelect: () => {
        window.location.href = `${TWITTER_APP_URL}/${get(record, 'id')}`;
      },
    },
    {
      value: 'deletePoll',
      label: (() => (
        <span className="text-red-500">
          <DeleteIcon className="mr-2" />
          Delete Poll
        </span>
      ))(),
      onSelect: () => withConfirm(setAction(actionsMap[ActionTypes.DELETE_POLL])),
    },
  ];

  const suggestionResources = [
    Collection.WORD_SUGGESTIONS,
    Collection.EXAMPLE_SUGGESTIONS,
    Collection.CORPUS_SUGGESTIONS,
    Collection.NSIBIDI_CHARACTERS,
  ];
  const mergedResources = [Collection.WORDS, Collection.EXAMPLES, Collection.CORPORA];

  const isSuggestionResource = suggestionResources.includes(resource as Collection);
  const isMergedResource = mergedResources.includes(resource as Collection);
  const isUserResource = Collection.USERS === resource;

  const initialOptions =
    resource === Collection.USERS
      ? userCollectionOptions
      : resource === Collection.WORD_SUGGESTIONS ||
        resource === Collection.EXAMPLE_SUGGESTIONS ||
        resource === Collection.CORPUS_SUGGESTIONS
      ? suggestionCollectionOptions
      : resource === Collection.POLLS
      ? pollCollectionOptions
      : mergedCollectionOptions;

  const options = [
    ...initialOptions,
    {
      value: 'copyURL',
      label: (() => (
        <span>
          <LinkIcon className="mr-2" />
          Copy Document URL
        </span>
      ))(),
      onSelect: () =>
        copyToClipboard(
          {
            copyText: `${window.location.origin}/#/${resource}/${record.id}/show`,
            successMessage: 'Document URL has been copied to your clipboard',
          },
          toast,
        ),
    },
  ];

  const FullButton = showButtonLabels ? Button : IconButton;

  const onSaveUserRole = ({ value }: { value: UserRoles; label: string }) => {
    setValue(value);
    withConfirm(setAction(actionsMap.Convert));
    onClose();
  };

  return (
    <>
      <Confirmation
        collection={collection}
        resource={resource}
        record={record}
        action={action}
        selectionValue={value}
        onClose={clearConfirmOpen}
        view={view}
        setIsLoading={setIsLoading}
        isOpen={isConfirmOpen}
      />
      <RolesDrawer isOpen={isOpen} onSave={onSaveUserRole} onClose={onClose} defaultRole={resource?.role} />
      <Box display="flex" flexDirection="row" alignItems="center" className="space-x-1">
        {/* @ts-expect-error label */}
        <Menu data-test="test-select-options" label="Editor's Action">
          <Tooltip label="More options">
            <MenuButton
              as={IconButton}
              variant={showButtonLabels ? '' : 'ghost'}
              maxWidth="160px"
              aria-label="Actions menu"
              icon={isLoading ? <Spinner size="xs" /> : showButtonLabels ? <LuMoreHorizontal /> : <LuMoreVertical />}
              data-test="actions-menu"
              role="button"
              fontFamily="system-ui"
              fontWeight="normal"
              isDisabled={isLoading}
              backgroundColor="white"
              _hover={{
                backgroundColor: 'gray.200',
                color: 'gray.800',
              }}
              _active={{
                backgroundColor: 'gray.200',
                color: 'gray.800',
              }}
              m={0}
            />
          </Tooltip>
          <MenuList boxShadow="xl">
            {options.map(({ value = '', label, onSelect, props = {} }) => (
              <Tooltip key={value} label={props.tooltipMessage}>
                <Box px={2}>
                  <MenuItem
                    value={value}
                    outline="none"
                    boxShadow="none"
                    border="none"
                    px={1}
                    fontFamily="system-ui"
                    borderRadius="md"
                    onClick={() => {
                      setValue(value);
                      onSelect({
                        push,
                        resource,
                        record,
                        id: record.id,
                      });
                    }}
                    {...omit(props, ['tooltipMessage'])}
                  >
                    {label}
                  </MenuItem>
                </Box>
              </Tooltip>
            ))}
          </MenuList>
        </Menu>
        {isSuggestionResource || isMergedResource || isUserResource ? (
          <Tooltip label="View entry">
            <FullButton
              variant={showButtonLabels ? '' : 'ghost'}
              aria-label="View entry button"
              {...{
                [showButtonLabels ? 'leftIcon' : 'icon']: <FiEye style={{ width: 'var(--chakra-sizes-10)' }} />,
              }}
              backgroundColor="white"
              _hover={{
                backgroundColor: 'gray.200',
                color: 'gray.800',
              }}
              _active={{
                backgroundColor: 'gray.200',
                color: 'gray.800',
              }}
              onClick={() => push(actionsMap.View(resource, record.id))}
            >
              {showButtonLabels ? 'View entry' : ''}
            </FullButton>
          </Tooltip>
        ) : null}
        {isSuggestionResource || isMergedResource ? (
          <Tooltip label="Edit entry">
            <FullButton
              variant={showButtonLabels ? '' : 'ghost'}
              aria-label="Edit entry button"
              {...{
                [showButtonLabels ? 'leftIcon' : 'icon']: <FiEdit3 style={{ width: 'var(--chakra-sizes-10)' }} />,
              }}
              icon={<FiEdit3 style={{ width: 'var(--chakra-sizes-10)' }} />}
              backgroundColor="white"
              _hover={{
                backgroundColor: 'gray.200',
                color: 'gray.800',
              }}
              _active={{
                backgroundColor: 'gray.200',
                color: 'gray.800',
              }}
              onClick={() =>
                isMergedResource
                  ? determineCreateSuggestionRedirection({ record, resource, push })
                  : push(actionsMap.Edit(resource, record.id))
              }
            >
              {showButtonLabels ? 'Edit' : ''}
            </FullButton>
          </Tooltip>
        ) : null}
      </Box>
    </>
  );
};

export default withRouter(
  connect(null, {
    push,
  })(Select),
);
