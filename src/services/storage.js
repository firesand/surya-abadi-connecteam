// src/services/storage.js
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadProfilePhoto = async (file, userId) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Get file extension safely
    const fileExtension = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `profiles/${userId}/${fileName}`);

    // Upload file
    console.log('Uploading file:', fileName);
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Upload successful, URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Upload profile photo error:', error);
    throw error;
  }
};

export const uploadAttendancePhoto = async (file, userId, date) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Get file extension safely
    const fileExtension = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `attendance_${userId}_${date}_${Date.now()}.${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `attendances/${userId}/${fileName}`);

    // Upload file
    console.log('Uploading attendance photo:', fileName);
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Attendance photo uploaded:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Upload attendance photo error:', error);
    throw error;
  }
};

export const uploadDocument = async (file, userId, documentType) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Get file extension safely
    let fileExtension = 'pdf'; // default extension
    if (file.name && file.name.includes('.')) {
      fileExtension = file.name.split('.').pop();
    }

    const fileName = `${documentType}_${userId}_${Date.now()}.${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `documents/${userId}/${fileName}`);

    // Upload file
    console.log('Uploading document:', fileName);
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Document uploaded:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Upload document error:', error);
    throw error;
  }
};
