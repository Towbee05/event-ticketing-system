const Category = require("../../models/Category");
const AppError = require("../../pkg/utils/AppError");

const list = () => Category.find().sort({ name: 1 });

const get = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  return category;
};

const create = (data) => Category.create(data);

const update = async (id, data) => {
  const category = await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  return category;
};

const remove = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
};

module.exports = { list, get, create, update, remove };
