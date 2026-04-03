import multer from 'multer';

const memoryStorage = multer.memoryStorage();

export const avatarUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const postImageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
