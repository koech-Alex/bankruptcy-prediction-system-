export const validateInput = (data) => {
  return Object.entries(data).every(
    ([key, val]) =>
      val !== "" && (key === "company_name" || key === "email" || !isNaN(val))
  );
};
