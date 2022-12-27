import React, { ReactElement, useState, useEffect } from 'react';
import { ShowProps, useShowController } from 'react-admin';
import {
  Box,
  Heading,
  Skeleton,
  Tooltip,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import diff from 'deep-diff';
import ReactAudioPlayer from 'react-audio-player';
import { DEFAULT_WORD_RECORD } from 'src/shared/constants';
import View from 'src/shared/constants/Views';
import Collection from 'src/shared/constants/Collections';
import WordClass from 'src/shared/constants/WordClass';
import { getWord } from 'src/shared/API';
import CompleteWordPreview from 'src/shared/components/CompleteWordPreview';
import ResolvedWord from 'src/shared/components/ResolvedWord';
import SourceField from 'src/shared/components/SourceField';
import generateFlags from 'src/shared/utils/flagHeadword';
import * as Interfaces from 'src/backend/controllers/utils/interfaces';
import {
  EditDocumentTopBar,
  ShowDocumentStats,
  EditDocumentIds,
  Comments,
} from '../../components';
import { determineDate } from '../../utils';
import DialectDiff from '../diffFields/DialectDiff';
import DiffField from '../diffFields/DiffField';
import ArrayDiffField from '../diffFields/ArrayDiffField';
import ExampleDiff from '../diffFields/ExampleDiff';
import ArrayDiff from '../diffFields/ArrayDiff';
import TenseDiff from '../diffFields/TenseDiff';
import Attributes from './Attributes';

const DIFF_FILTER_KEYS = [
  'id',
  'approvals',
  'denials',
  'merged',
  'author',
  'authorId',
  'authorEmail',
  'userComments',
  'editorsNotes',
  'originalWordId',
  'id',
  'updatedAt',
  'stems',
  'normalized',
  'mergedBy',
];

const WordShow = (props: ShowProps): ReactElement => {
  const [isLoading, setIsLoading] = useState(true);
  const [originalWordRecord, setOriginalWordRecord] = useState<any>({});
  const [diffRecord, setDiffRecord] = useState(null);
  const showProps = useShowController(props);
  const { resource } = showProps;
  // @ts-expect-error
  let { record } : { record: Interfaces.Word } = showProps;
  const { permissions } = props;
  const hasFlags = !!Object.values(generateFlags({ word: record || {}, flags: {} }).flags).length;

  record = record || DEFAULT_WORD_RECORD;

  const {
    id,
    author,
    word,
    approvals,
    denials,
    editorsNotes,
    userComments,
    merged,
    pronunciation,
    originalWordId,
    updatedAt,
  } = record;

  const resourceTitle = {
    wordSuggestions: 'Word Suggestion',
    genericWords: 'Generic Word',
    words: 'Word',
  };

  /* Grabs the original word if it exists */
  useEffect(() => {
    (async () => {
      try {
        const originalWord = record?.originalWordId ? await getWord(record.originalWordId).catch((err) => {
          // Unable to retrieve word
          console.log(err);
        }) : null;
        const differenceRecord = diff(originalWord, record, (_, key) => DIFF_FILTER_KEYS.indexOf(key) > -1);
        setOriginalWordRecord(originalWord);
        setDiffRecord(differenceRecord);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [record]);

  return (
    <Skeleton isLoaded={!isLoading}>
      <Box className="bg-white shadow-sm p-10 mt-10">
        <EditDocumentTopBar
          record={record}
          resource={resource}
          view={View.SHOW}
          id={id}
          permissions={permissions}
          title={`${resourceTitle[resource]} Document Details`}
        />
        <Box className="flex flex-col lg:flex-row mb-1">
          <Box className="flex flex-col flex-auto justify-between items-start">
            <Box className="w-full flex flex-col lg:flex-row justify-between items-center">
              <Box>
                <Heading fontSize="lg" className="text-xl text-gray-700">
                  <>
                    {'Last Updated: '}
                    {determineDate(updatedAt)}
                  </>
                </Heading>
                <EditDocumentIds
                  collection={Collection.WORDS}
                  originalId={originalWordId}
                  id={id}
                  title="Parent Word Id:"
                />
              </Box>
            </Box>
            <Box className="flex flex-row items-center space-x-6 mt-5">
              <Box className="flex flex-col">
                <Tooltip
                  placement="top"
                  backgroundColor="orange.300"
                  color="gray.800"
                  label={hasFlags
                    ? 'This word has been flagged as invalid due to the headword not '
                      + 'following the Dictionary Editing Standards document. Please edit this word for more details.'
                    : ''}
                >
                  <Box className="flex flex-row items-center cursor-default">
                    {hasFlags ? <WarningIcon color="orange.600" boxSize={3} mr={2} /> : null}
                    <Heading
                      fontSize="lg"
                      className="text-xl text-gray-600"
                      color={hasFlags ? 'orange.600' : ''}
                    >
                      Word
                    </Heading>
                  </Box>
                </Tooltip>
                <DiffField
                  path="word"
                  diffRecord={diffRecord}
                  fallbackValue={word}
                />
              </Box>
            </Box>
            <Box className="flex flex-col mt-5">
              <Heading fontSize="lg" className="text-xl text-gray-600">Audio Pronunciation</Heading>
              {/* TODO: check this part! */}
              <DiffField
                path="word"
                diffRecord={diffRecord}
                fallbackValue={pronunciation ? (
                  <ReactAudioPlayer
                    src={pronunciation}
                    style={{ marginTop: '15px', height: '40px', width: '250px' }}
                    controls
                  />
                ) : <span>No audio pronunciation</span>}
                renderNestedObject={() => (
                  <ReactAudioPlayer
                    src={pronunciation}
                    style={{ marginTop: '15px', height: '40px', width: '250px' }}
                    controls
                  />
                )}
              />
            </Box>
            <Box className="flex flex-col mt-5 w-full lg:w-11/12">
              <Heading fontSize="lg" className="text-xl text-gray-600">Definition Groups</Heading>
              {record.definitions.map((definition, index) => (
                <Box
                  className="pl-4 pb-4 space-y-4 mt-4"
                  borderBottomColor="gray.200"
                  borderBottomWidth="1px"
                >
                  <Box className="flex flex-col">
                    <Heading fontSize="md" className="text-gray-600">Part of Speech</Heading>
                    <DiffField
                      path={`definitions.${index}.wordClass`}
                      diffRecord={diffRecord}
                      fallbackValue={
                        WordClass[(definition.wordClass as string)]?.label
                        || `${definition.wordClass} [UPDATE PART OF SPEECH]`
                      }
                    />
                  </Box>
                  <Box className="flex flex-col">
                    <Heading fontSize="lg" className="text-xl text-gray-600">Nsịbịdị</Heading>
                    <DiffField
                      path={`definitions.${index}.nsibidi`}
                      diffRecord={diffRecord}
                      fallbackValue={definition.nsibidi}
                      renderNestedObject={(value) => (
                        <span className={value ? 'akagu' : ''}>{value || 'N/A'}</span>
                      )}
                    />
                  </Box>
                  <Box className="flex flex-col">
                    <Heading fontSize="md" className="text-xl text-gray-600">Definitions</Heading>
                    {/* ts-expect-error */}
                    <ArrayDiffField
                      recordField={`definitions.${index}.definitions`}
                      recordFieldSingular="definition"
                      record={record}
                      // ts-expect-error
                      originalWordRecord={originalWordRecord}
                    >
                      {/* ts-expect-error */}
                      <ArrayDiff diffRecord={diffRecord} recordField={`definitions.${index}.definitions`} />
                    </ArrayDiffField>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box className="flex flex-col mt-5">
              <Heading fontSize="lg" className="text-xl text-gray-600">Variations</Heading>
              {/* @ts-ignore */}
              <ArrayDiffField
                recordField="variations"
                recordFieldSingular="variation"
                record={record}
                // @ts-ignore
                originalWordRecord={originalWordRecord}
              >
                {/* @ts-ignore */}
                <ArrayDiff diffRecord={diffRecord} recordField="variations" />
              </ArrayDiffField>
            </Box>
            <Box className="flex flex-col mt-5">
              <Heading fontSize="lg" className="text-xl text-gray-600">Word Stems</Heading>
              {/* @ts-ignore */}
              <ArrayDiffField
                recordField="stems"
                recordFieldSingular="stem"
                record={record}
                // @ts-ignore
                originalWordRecord={originalWordRecord}
              >
                {/* @ts-ignore */}
                <ArrayDiff
                  diffRecord={diffRecord}
                  recordField="stems"
                  renderNestedObject={(wordId) => <ResolvedWord wordId={wordId} />}
                />
              </ArrayDiffField>
            </Box>
            <Box className="flex flex-col mt-5">
              <Heading fontSize="lg" className="text-xl text-gray-600">Related Terms</Heading>
              {/* @ts-ignore */}
              <ArrayDiffField
                recordField="relatedTerms"
                recordFieldSingular="relatedTerm"
                record={record}
                // @ts-ignore
                originalWordRecord={originalWordRecord}
              >
                {/* @ts-ignore */}
                <ArrayDiff
                  diffRecord={diffRecord}
                  recordField="relatedTerms"
                  renderNestedObject={(wordId) => <ResolvedWord wordId={wordId} />}
                />
              </ArrayDiffField>
            </Box>
            <Box className="flex flex-col mt-5">
              <Heading fontSize="lg" className="text-xl text-gray-600">Examples</Heading>
              {/* @ts-ignore */}
              <ArrayDiffField
                recordField="examples"
                recordFieldSingular="example"
                record={record}
                // @ts-ignore
                originalWordRecord={originalWordRecord}
              >
                {/* @ts-ignore */}
                <ExampleDiff
                  diffRecord={diffRecord}
                  // @ts-ignore
                  resource={resource}
                />
              </ArrayDiffField>
            </Box>
            {resource !== Collection.WORDS ? (
              <Comments editorsNotes={editorsNotes} userComments={userComments} />
            ) : null}
          </Box>
          <Box className="mb-10 lg:mb-0 space-y-3 flex flex-col items-start">
            <CompleteWordPreview record={record} showFull={false} className="my-5 lg:my-0" />
            {resource !== Collection.WORDS && (
              <>
                <SourceField record={record} source="source" />
                <ShowDocumentStats
                  approvals={approvals}
                  denials={denials}
                  merged={merged}
                  author={author}
                  collection={Collection.WORDS}
                />
              </>
            )}
            <Box className="flex flex-col w-full justify-between">
              <Attributes record={record} diffRecord={diffRecord} />
              <Box className="flex flex-col space-y-6 mt-5">
                <Box className="flex flex-col mt-5">
                  <Heading fontSize="lg" className="text-xl text-gray-600">Tags</Heading>
                  {/* @ts-ignore */}
                  <ArrayDiffField
                    recordField="tags"
                    recordFieldSingular="tag"
                    record={record}
                    // @ts-ignore
                    originalWordRecord={originalWordRecord}
                  >
                    {/* @ts-ignore */}
                    <ArrayDiff diffRecord={diffRecord} recordField="tags" />
                  </ArrayDiffField>
                </Box>
                <Box>
                  <Heading fontSize="lg" className="text-xl text-gray-600 mb-2">Dialects</Heading>
                  <DialectDiff
                    record={record}
                    diffRecord={diffRecord}
                    resource={resource}
                  />
                </Box>
                <Box>
                  <Heading fontSize="lg" className="text-xl text-gray-600 mb-2">Tenses</Heading>
                  <TenseDiff
                    record={record}
                    resource={resource}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Skeleton>
  );
};

export default WordShow;
