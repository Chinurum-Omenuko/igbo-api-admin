import { Connection } from 'mongoose';
import { assign, omit } from 'lodash';
import { exampleSuggestionSchema } from '../../../models/ExampleSuggestion';
import * as Interfaces from '../../utils/interfaces';
import { searchExamples } from '../../examples';
import Author from '../../../shared/constants/Author';

const handleCreatingNewExampleSuggestions = async ({
  query,
  skip,
  limit,
  mongooseConnection,
}: {
  query: Record<string, unknown>;
  skip: number;
  limit: number;
  mongooseConnection: Connection;
}): Promise<Interfaces.ExampleSuggestion[]> => {
  const ExampleSuggestion = mongooseConnection.model<Interfaces.ExampleSuggestion>(
    'ExampleSuggestion',
    exampleSuggestionSchema,
  );
  const examples = await searchExamples({ query, skip, limit, mongooseConnection });
  const existingExampleSuggestions = await ExampleSuggestion.find({
    originalExampleId: { $in: examples.map(({ id }) => id) },
  });

  // Filters for Examples without Example Suggestions
  const examplesWithoutSuggestions = examples.reduce((examplesWithoutSuggestions, example) => {
    const exampleSuggestion = existingExampleSuggestions.find(
      ({ originalExampleId }) => example.id === originalExampleId,
    );
    if (!exampleSuggestion) {
      examplesWithoutSuggestions.push(example);
    }
    return examplesWithoutSuggestions;
  }, [] as Interfaces.Example[]);

  // Creates new Example Suggestions for Example documents that don't have existing children Suggestions
  const exampleSuggestionData = examplesWithoutSuggestions.map((exampleDoc) => {
    const example = exampleDoc.toJSON();
    return omit(
      {
        ...assign(example),
        exampleForSuggestion: false,
        authorId: Author.SYSTEM, // Tells up the ExampleSuggestion has been automatically generated
        originalExampleId: example.id || example._id,
      },
      ['id'],
    );
  }) as Interfaces.ExampleClientData[];

  // Creates new ExampleSuggestions
  const exampleSuggestions = await Promise.all(
    exampleSuggestionData.map(async (data) => {
      const exampleSuggestion = new ExampleSuggestion(data);
      return exampleSuggestion.save();
    }),
  );
  const finalExampleSuggestions = existingExampleSuggestions.concat(exampleSuggestions);
  return finalExampleSuggestions;
};

export default handleCreatingNewExampleSuggestions;
