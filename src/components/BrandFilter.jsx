import { useData, useFilters } from '../data/dataLoader.jsx';

const BrandFilter = () => {
  const { data } = useData();
  const { focusedBrand, setFocusedBrand, brandNames } = useFilters();

  if (!data?.brands || brandNames.length === 0) return null;

  const logoMap = {};
  data.brands.forEach(b => { logoMap[b.name] = b.logo; });

  return (
    <div className="flex items-center gap-5 overflow-x-auto py-1">
      {brandNames.map((brand) => {
        const isFocused = focusedBrand === brand;
        const logo = logoMap[brand];

        return (
          <button
            key={brand}
            onClick={() => setFocusedBrand(brand)}
            className={`flex-shrink-0 w-14 h-14 rounded-full overflow-hidden bg-white transition-all duration-200 cursor-pointer ${
              isFocused
                ? ''
                : 'grayscale opacity-60 hover:opacity-90 hover:grayscale-0'
            }`}
            title={brand}
          >
            <img
              src={logo}
              alt={brand}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="flex items-center justify-center w-full h-full text-[10px] font-bold text-gray-500">${brand.substring(0, 3)}</span>`;
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default BrandFilter;
