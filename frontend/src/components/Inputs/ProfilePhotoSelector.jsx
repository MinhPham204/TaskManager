import React, { useState, useRef, useEffect } from "react";
import { LuTrash, LuUser, LuUpload } from "react-icons/lu";

const ProfilePhotoSelector = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // cleanup objectURL khi unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = ""; // reset input file
    }
  };

  const onChooseFile = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="flex justify-center mb-6">
      {/* input ẩn để mở file picker */}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {!image ? (
        // Chưa có ảnh thì hiển thị avatar default + nút upload
        <div
          className="w-20 h-20 flex items-center justify-center bg-blue-100/50 rounded-full relative cursor-pointer"
          onClick={onChooseFile}
        >
          <LuUser className="text-4xl text-primary" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // tránh bị click double
              onChooseFile();
            }}
            className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full absolute -bottom-1 -right-1 cursor-pointer z-10"
          >
            <LuUpload />
          </button>
        </div>
      ) : (
        // Đã có ảnh thì hiển thị preview + nút xóa
        <div className="relative">
          <img
            src={previewUrl}
            alt="profile"
            className="w-20 h-20 rounded-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute -bottom-1 -right-1 z-10"
          >
            <LuTrash className="cursor-pointer" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoSelector;
