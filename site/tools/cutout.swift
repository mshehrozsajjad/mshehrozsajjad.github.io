// Cuts the subject out of a photo with macOS's own subject lifting (Vision, macOS 14+): no model to download.
// The result goes to tools/sticker.py, which adds the white die-cut outline.
// Run: swift tools/cutout.swift in.png out.png
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count == 3 else { fatalError("usage: swift tools/cutout.swift in.png out.png") }
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: args[1]))
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let subject = request.results?.first else { fatalError("no subject found in \(args[1])") }
let cut = try subject.generateMaskedImage(ofInstances: subject.allInstances, from: handler, croppedToInstancesExtent: false)
try CIContext().writePNGRepresentation(of: CIImage(cvPixelBuffer: cut), to: URL(fileURLWithPath: args[2]),
                                       format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("cut out \(subject.allInstances.count) subject(s) to \(args[2])")
