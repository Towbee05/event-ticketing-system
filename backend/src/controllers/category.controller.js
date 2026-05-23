const catchAsync = require("../utils/catchAsync");
const { success } = require("../utils/response");
const service = require("../services/category.service");

const list = catchAsync(async (_req, res) => {
  const data = await service.list();
  success(res, { data });
});

const getOne = catchAsync(async (req, res) => {
  const data = await service.get(req.params.id);
  success(res, { data });
});

const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body);
  success(res, { statusCode: 201, message: "Category created", data });
});

const update = catchAsync(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  success(res, { message: "Category updated", data });
});

const remove = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  success(res, { message: "Category deleted" });
});

module.exports = { list, getOne, create, update, remove };
