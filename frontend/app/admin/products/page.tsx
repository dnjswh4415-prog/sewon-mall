"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAdminProducts } from "@/src/api/admin";
import {
  deleteProductImage,
  getProductImages,
  setMainProductImage,
  uploadMainProductImage,
  uploadSubProductImages,
} from "@/src/api/product-image";

const API_BASE_URL = "http://localhost:5000";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [imagesMap, setImagesMap] = useState<Record<number, any[]>>({});
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await getAdminProducts();
      const productList = Array.isArray(res) ? res : [];
      setProducts(productList);

      const imageEntries = await Promise.all(
        productList.map(async (product) => {
          const images = await getProductImages(product.id);
          return [product.id, Array.isArray(images) ? images : []] as const;
        })
      );

      setImagesMap(Object.fromEntries(imageEntries));
    } catch (error) {
      console.error("관리자 상품 조회 실패", error);
      setProducts([]);
      setImagesMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const summary = useMemo(() => {
    const totalProducts = products.length;

    const totalVariants = products.reduce(
      (sum, product) => sum + (Array.isArray(product.variants) ? product.variants.length : 0),
      0
    );

    const noImageCount = products.filter((product) => {
      const images = imagesMap[product.id] ?? [];
      return images.length === 0;
    }).length;

    const lowStockCount = products.filter((product) => Number(product.stock ?? 0) <= 5).length;

    return {
      totalProducts,
      totalVariants,
      noImageCount,
      lowStockCount,
    };
  }, [products, imagesMap]);

  const handleMainUpload = async (productId: number, file: File) => {
    try {
      setUploadingId(productId);
      await uploadMainProductImage(productId, file);
      alert("대표 이미지 업로드 완료");
      await fetchProducts();
    } catch (error) {
      console.error("대표 이미지 업로드 실패", error);
      alert("대표 이미지 업로드 실패");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSubUpload = async (productId: number, files: FileList) => {
    try {
      setUploadingId(productId);
      await uploadSubProductImages(productId, Array.from(files));
      alert("추가 이미지 업로드 완료");
      await fetchProducts();
    } catch (error) {
      console.error("추가 이미지 업로드 실패", error);
      alert("추가 이미지 업로드 실패");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSetMain = async (productId: number, imageId: number) => {
    try {
      await setMainProductImage(productId, imageId);
      alert("대표 이미지가 변경되었습니다.");
      await fetchProducts();
    } catch (error) {
      console.error("대표 이미지 변경 실패", error);
      alert("대표 이미지 변경 실패");
    }
  };

  const handleDelete = async (imageId: number) => {
    try {
      await deleteProductImage(imageId);
      alert("이미지가 삭제되었습니다.");
      await fetchProducts();
    } catch (error) {
      console.error("이미지 삭제 실패", error);
      alert("이미지 삭제 실패");
    }
  };

  const getImageSrc = (imageUrl?: string | null) => {
    if (!imageUrl) return "/no-image.png";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  };

  if (loading) {
    return <div className="p-6">상품 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">상품 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            상품 기본 정보와 대표 이미지, 추가 이미지를 함께 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            대시보드
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            주문 관리
          </Link>
          <Link
            href="/admin/stock"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            재고 관리
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">전체 상품 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.totalProducts}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">전체 옵션 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.totalVariants}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">이미지 없는 상품</div>
          <div className="mt-2 text-2xl font-bold">{summary.noImageCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">저재고 상품</div>
          <div className="mt-2 text-2xl font-bold">{summary.lowStockCount}</div>
        </div>
      </section>

      {products.length === 0 ? (
        <div className="rounded-xl border p-4 text-gray-500">
          등록된 상품이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => {
            const images = imagesMap[product.id] ?? [];
            const mainImage = images.find((image: any) => image.isMain);
            const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;
            const optionCount = Array.isArray(product.options) ? product.options.length : 0;

            return (
              <div key={product.id} className="rounded-xl border p-4 space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="h-32 w-32 overflow-hidden rounded-xl border bg-gray-50">
                      <img
                        src={getImageSrc(mainImage?.imageUrl ?? product.imageUrl)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/no-image.png";
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-lg font-semibold">
                        [{product.Category?.name ?? "미분류"}] {product.name}
                      </div>

                      <div className="text-sm text-gray-600">
                        상품 ID: {product.id}
                      </div>

                      <div className="text-sm text-gray-600">
                        가격: {Number(product.price ?? 0).toLocaleString()}원
                      </div>

                      <div className="text-sm text-gray-600">
                        기본 재고: {Number(product.stock ?? 0)}
                      </div>

                      <div className="text-sm text-gray-600">
                        옵션 수: {optionCount} / variant 수: {variantCount}
                      </div>

                      <div className="text-sm text-gray-600">
                        등록 이미지 수: {images.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/stock/${product.id}`}
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
                    >
                      재고 상세 보기
                    </Link>
                  </div>
                </div>

                {Array.isArray(product.variants) && product.variants.length > 0 && (
                  <section className="rounded-xl bg-gray-50 p-4 space-y-3">
                    <h2 className="text-sm font-semibold">옵션 / Variant 정보</h2>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {product.variants.map((variant: any) => (
                        <div key={variant.id} className="rounded-lg border bg-white p-3 text-sm">
                          <div className="font-medium">{variant.sku ?? `Variant #${variant.id}`}</div>

                          <div className="mt-1 text-gray-600">
                            재고: {Number(variant.stock ?? 0)}
                          </div>

                          <div className="text-gray-600">
                            가격:{" "}
                            {Number(
                              variant.price !== null && variant.price !== undefined
                                ? variant.price
                                : product.price
                            ).toLocaleString()}
                            원
                          </div>

                          {Array.isArray(variant.options) && variant.options.length > 0 && (
                            <div className="mt-2 text-gray-600">
                              옵션:{" "}
                              {variant.options
                                .map(
                                  (opt: any) =>
                                    `${opt.value?.option?.name ?? "옵션"}: ${
                                      opt.value?.value ?? "-"
                                    }`
                                )
                                .join(" / ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="rounded-xl border p-4 space-y-4">
                  <h2 className="text-lg font-semibold">이미지 업로드</h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">대표 이미지 업로드</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          handleMainUpload(product.id, file);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">추가 이미지 여러 장 업로드</div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          handleSubUpload(product.id, files);
                        }}
                      />
                    </div>
                  </div>

                  {uploadingId === product.id && (
                    <div className="text-sm text-gray-500">업로드 중입니다...</div>
                  )}

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                    {images.length === 0 ? (
                      <div className="text-sm text-gray-500">등록된 이미지가 없습니다.</div>
                    ) : (
                      images.map((image: any) => (
                        <div key={image.id} className="rounded-lg border p-2 space-y-2">
                          <img
                            src={getImageSrc(image.imageUrl)}
                            alt="product"
                            className="h-32 w-full rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/no-image.png";
                            }}
                          />

                          <div className="text-xs">
                            {image.isMain ? (
                              <span className="rounded bg-black px-2 py-1 text-white">
                                대표 이미지
                              </span>
                            ) : (
                              <span className="rounded bg-gray-200 px-2 py-1">
                                추가 이미지
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {!image.isMain && (
                              <button
                                onClick={() => handleSetMain(product.id, image.id)}
                                className="rounded border px-2 py-1 text-xs"
                              >
                                대표로 변경
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(image.id)}
                              className="rounded border px-2 py-1 text-xs text-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}