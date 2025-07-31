// tests/uploadMiddleware.test.js
const upload = require('../../src/middlewares/upload.middleware');

describe('Upload Middleware (multer)', () => {
  it('→ deve limitar tamanho de arquivo a 5MB', () => {
    // multer expõe o objeto de limites em `upload.limits`
    expect(upload.limits).toBeDefined();
    expect(upload.limits.fileSize).toBe(5 * 1024 * 1024);
  });

  describe('fileFilter', () => {
    const fileFilter = upload.fileFilter; // agora é `upload.fileFilter`

    it('→ rejeita quando mimetype não for imagem', () => {
      const cb = jest.fn();
      const fakeFile = { mimetype: 'text/plain' };
      fileFilter({}, fakeFile, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
      const err = cb.mock.calls[0][0];
      expect(err.message).toBe('Somente arquivos de imagem são permitidos');
    });

    it('→ aceita quando mimetype começa com image/', () => {
      const cb = jest.fn();
      const fakeFile = { mimetype: 'image/png' };
      fileFilter({}, fakeFile, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });
});
