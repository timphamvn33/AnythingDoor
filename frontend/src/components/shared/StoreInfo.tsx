interface StoreProbs {
  name: string | undefined;
  openHrs: string | undefined;
  closeHrs: string | undefined;
  category: string[] | undefined;
}
export default function StoreInfo({ name, openHrs, closeHrs, category }: StoreProbs) {
  return (
    <>
      <div>
        <h3 className="text-xl font-semibold mb-1">{name}</h3>

        <div className="text-sm text-gray-600 mb-0.5">
          <span className="font-medium">Open Hrs:</span> {openHrs}
        </div>

        <div className="text-sm text-gray-600 mb-0.5">
          <span className="font-medium">Close Hrs:</span> {closeHrs}
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">Category:</span> {category?.join(', ')}
        </div>
      </div>
    </>
  );
}
