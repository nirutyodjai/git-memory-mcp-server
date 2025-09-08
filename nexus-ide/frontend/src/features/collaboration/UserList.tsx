import React from 'react';

interface User {
  id: string;
  name: string;
}

interface UserListProps {
  users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <div className="w-48 bg-gray-900 text-white p-4">
      <h2 className="text-lg font-bold mb-4">Connected Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="flex items-center mb-2">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;