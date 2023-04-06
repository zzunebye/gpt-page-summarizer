import { FunctionComponent } from "preact";
import { Spinner } from "@chakra-ui/react";

const PrimaryButton: FunctionComponent<PrimaryButtonProps> = ({
  isLoading,
  onClick,
  children,
}) => {
  return (
    <button
      class={`w-full mb-4 py-2 px-4 bg-blue-500 text-white font-semibold rounded ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
    >
      {isLoading ? <Spinner size="xs" /> : children}
    </button>
  );
};

type PrimaryButtonProps = {
  isLoading: boolean;
  onClick: () => void;
  children: any;
};

export default PrimaryButton;
