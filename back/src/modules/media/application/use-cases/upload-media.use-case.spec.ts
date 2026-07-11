import { FakeIpfsStorage } from '../test-fakes';
import { InvalidMediaFileError } from '../../domain/media.errors';
import { UploadMediaUseCase } from './upload-media.use-case';

describe('UploadMediaUseCase', () => {
  let storage: FakeIpfsStorage;
  let useCase: UploadMediaUseCase;

  beforeEach(() => {
    storage = new FakeIpfsStorage();
    useCase = new UploadMediaUseCase(storage);
  });

  it('uploads a valid file to IPFS', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('fake image'),
      filename: 'logo.png',
      mimetype: 'image/png',
      size: 1024,
    });

    expect(result.cid).toBe('cid-1');
    expect(storage.uploaded).toHaveLength(1);
    expect(storage.uploaded[0].filename).toBe('logo.png');
  });

  it('rejects an image exceeding 5MB', async () => {
    await expect(
      useCase.execute({
        buffer: Buffer.alloc(0),
        filename: 'huge.png',
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
      }),
    ).rejects.toBeInstanceOf(InvalidMediaFileError);
    expect(storage.uploaded).toHaveLength(0);
  });

  it('allows a non-image up to 10MB', async () => {
    const result = await useCase.execute({
      buffer: Buffer.alloc(0),
      filename: 'proof.pdf',
      mimetype: 'application/pdf',
      size: 9 * 1024 * 1024,
    });
    expect(result.cid).toBe('cid-1');
  });

  it('rejects a non-image exceeding 10MB', async () => {
    await expect(
      useCase.execute({
        buffer: Buffer.alloc(0),
        filename: 'proof.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024,
      }),
    ).rejects.toBeInstanceOf(InvalidMediaFileError);
  });
});
