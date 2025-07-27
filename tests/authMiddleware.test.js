// tests/authMiddleware.test.js
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

const authMiddleware = require('../src/middlewares/authMiddleware');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jwt.verify.mockReset();
  });

  it('→ retorna 401 se não vier Authorization header', () => {
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('→ retorna 401 se formato do token for inválido', () => {
    req.headers.authorization = 'Bear token';
    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Formato do token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('→ retorna 401 se jwt.verify der erro', () => {
    req.headers.authorization = 'Bearer abc.def.ghi';
    jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('fail'), null));
    authMiddleware(req, res, next);
    expect(jwt.verify).toHaveBeenCalledWith('abc.def.ghi', process.env.JWT_SECRET, expect.any(Function));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('→ chama next e anexa req._ong e req.id_ong quando token é válido', () => {
    req.headers.authorization = 'Bearer valid.token.here';
    const decoded = { email_ong: 'contato@ong.org', id_ong: 123 };
    jwt.verify.mockImplementation((token, secret, cb) => cb(null, decoded));

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', process.env.JWT_SECRET, expect.any(Function));
    expect(req._ong).toBe(decoded.email_ong);
    expect(req.id_ong).toBe(decoded.id_ong);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
