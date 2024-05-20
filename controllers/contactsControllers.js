import HttpError from "../helpers/HttpError.js";
import { ctrlWrapper } from "../helpers/ctrlWrapper.js";
import { Contact } from "../models/contactsModel.js";

const listContacts = async (req, res) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 20, favorite } = req.query;
  const skip = (page - 1) * limit;

  let query = { owner };

  if (favorite === "true") {
    query.favorite = true;
  }

  const contacts = await Contact.find(query, "-createdAt -updatedAt", { skip, limit }).populate(
    "owner",
    "email"
  );

  console.log(contacts);
  res.status(200).json(contacts);
};
export const getAllContacts = ctrlWrapper(listContacts);

const getContactById = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const contact = await Contact.findOne({ _id: id, owner });

  if (contact === null) {
    throw HttpError(404, "Not found");
  }

  res.status(200).json(contact);
};
export const getOneContact = ctrlWrapper(getContactById);

const removeContact = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const contact = await Contact.findOneAndDelete({ _id: id, owner });

  if (contact === null) {
    throw HttpError(404, "Not found");
  }

  res.status(200).json(contact);
};
export const deleteContact = ctrlWrapper(removeContact);

const addContact = async (req, res) => {
  const { _id: owner } = req.user;
  const newContact = await Contact.create({ ...req.body, owner });

  res.status(201).json(newContact);
};
export const createContact = ctrlWrapper(addContact);

const updateById = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const result = await Contact.findOneAndUpdate({ _id: id, owner }, req.body, { new: true });

  if (result === null) {
    throw HttpError(404, "Not found");
  }

  const size = Object.keys(req.body).length;
  if (size === 0) throw HttpError(400, "Body must have at least one field");

  res.status(200).json(result);
};
export const updateContact = ctrlWrapper(updateById);

const updateFavoriteStatus = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const result = await Contact.findOneAndUpdate({ _id: id, owner }, req.body, { new: true });

  if (result === null) throw HttpError(404, "Not found");

  res.status(200).json(result);
};
export const updateFavorite = ctrlWrapper(updateFavoriteStatus);
