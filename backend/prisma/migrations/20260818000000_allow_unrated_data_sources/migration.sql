-- Nguồn RSS chưa được chấm độ tin cậy; NULL tránh biến giá trị tạm thành kết luận nghiệp vụ.
ALTER TABLE "data_source" ALTER COLUMN "reliability_tier" DROP NOT NULL;
