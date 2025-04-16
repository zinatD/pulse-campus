import { BsSearch } from 'react-icons/bs';

const SearchBox = () => {
  return (
    <div className="flex items-center h-[30px] bg-primary rounded-full px-5 shadow-lg max-w-[500px] mx-auto">
      <input
        type="text"
        placeholder="Search..."
        className="bg-transparent text-white placeholder-white/70 focus:w-[250px] w-0 transition-all duration-500 outline-none border-none font-medium"
      />
      <a href="#" className="text-white">
        <BsSearch />
      </a>
    </div>
  );
};

export default SearchBox;