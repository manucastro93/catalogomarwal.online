import { Banner } from '../models/index.js';

export const seedBanners = async () => {
  await Banner.create({
    imagen: '/banners/banner1.jpg',
    orden: 1,
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1))
  });
};
