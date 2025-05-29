import User from '../models/users.js';
import bcrypt from 'bcrypt';

// Crear un nuevo usuario (Admin)
export const createUser = async (req, res) => {
  try {
    const { username, email, password, number, isAdmin, isActive } = req.body;
    // Se podría añadir más validación aquí (ej. si el email ya existe)
    const newUser = new User({ username, email, password, number, isAdmin, isActive });
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado exitosamente', userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// Obtener todos los usuarios (Admin)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Excluir contraseñas
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Obtener un usuario por ID (Admin)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, '-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

// Actualizar un usuario (Admin)
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Si se está actualizando la contraseña, hashearla
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar un usuario (Admin)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    // Aquí podrías añadir lógica para eliminar/limpiar datos asociados al usuario si es necesario
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
}; 