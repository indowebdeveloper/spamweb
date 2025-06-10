import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "b14af486-ebd0-4ae8-97f8-50dd69e747e4");
  requestHeaders.set("x-createxyz-project-group-id", "b24deb0f-6e70-4ce2-bf13-f1ece00f37e3");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}