export const MenuBar = () => {
  const menuItems = ['File', 'Edit', 'View', 'Insert', 'Help'];

  return (
    <div className="win95-menu">
      {menuItems.map((item) => (
        <button key={item} className="win95-menu-item">
          {item}
        </button>
      ))}
    </div>
  );
};
