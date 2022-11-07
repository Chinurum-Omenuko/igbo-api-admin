import React, { ReactElement } from 'react';
import { Record } from 'react-admin';
import { get, has } from 'lodash';
import { Box, Text } from '@chakra-ui/react';

const ArrayDiffField = (
  {
    recordField,
    recordFieldSingular,
    record,
    originalWordRecord,
    children = [],
  }
  : {
    recordField: string,
    recordFieldSingular: string,
    record: Record,
    originalWordRecord: Record,
    children: ReactElement[],
  },
): ReactElement => {
  const longestRecordField = !originalWordRecord || !has(originalWordRecord, recordField)
    ? get(record, recordField)
    : get(originalWordRecord, recordField)?.length > get(record, recordField)?.length
      ? get(originalWordRecord, recordField)
      : get(record, recordField);

  return longestRecordField?.length ? longestRecordField?.map((value, index) => (
    <Box
      // eslint-disable-next-line react/no-array-index-key
      key={`array-diff-field-${recordFieldSingular}-${index}`}
      className="flex flex-row items-start space-x-2 mt-4"
      data-test={`${recordFieldSingular}-${index}`}
    >
      <h2 className="text-xl text-gray-600">{`${index + 1}. `}</h2>
      {React.Children.map(children, (child) => (
        React.cloneElement(child, { value, index })
      ))}
    </Box>
  )) : <Text className="text-gray-500 italic">{`No ${recordField}`}</Text>;
};

export default ArrayDiffField;
