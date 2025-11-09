// lib/userUtils.js
export const getTeachersFromUsers = (users) => {
  return users.filter(user => user.role === 'teacher');
};
