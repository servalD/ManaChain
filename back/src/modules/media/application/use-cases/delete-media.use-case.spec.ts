import { FakeIpfsStorage, FakeMediaReferenceChecker } from '../test-fakes';
import {
  InvalidMediaFileError,
  MediaNotOwnedError,
} from '../../domain/media.errors';
import { DeleteMediaUseCase } from './delete-media.use-case';

describe('DeleteMediaUseCase', () => {
  let storage: FakeIpfsStorage;
  let referenceChecker: FakeMediaReferenceChecker;
  let useCase: DeleteMediaUseCase;

  beforeEach(() => {
    storage = new FakeIpfsStorage();
    referenceChecker = new FakeMediaReferenceChecker();
    useCase = new DeleteMediaUseCase(storage, referenceChecker);
  });

  it('unpins a CID not owned by anyone else', async () => {
    await useCase.execute('user-1', 'cidOrphan1');
    expect(storage.unpinned).toEqual(['cidOrphan1']);
  });

  it('refuses to unpin a CID referenced by another user', async () => {
    referenceChecker.seedOwnedByOther('cidTaken1');

    await expect(useCase.execute('user-1', 'cidTaken1')).rejects.toBeInstanceOf(
      MediaNotOwnedError,
    );
    expect(storage.unpinned).toHaveLength(0);
  });

  it('rejects a malformed CID before touching storage', async () => {
    await expect(
      useCase.execute('user-1', '../etc/passwd'),
    ).rejects.toBeInstanceOf(InvalidMediaFileError);
    expect(storage.unpinned).toHaveLength(0);
  });
});
