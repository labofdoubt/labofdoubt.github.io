---
title: "Normalization-free transformers are subcritical. Part 2."
date: 2026-01-12
description: "Part 2 (draft/unlisted)."
unlisted: true
---

<!--
This post is intentionally marked `unlisted: true` so it does not appear on /blog/,
but it is still generated and reachable by direct URL: /blog/norm-free-transformers-subcritical-part-2/

Starting point: copied from `norm-free-transformers-subcritical.md`.
-->

## Overview

In my previous blog post, I demonstrated empirically that normalization-free (DyT/Derf) transformers [] have worse gradient propagation properties than the standard pre-LN transformer—namely, they exhibit much stronger gradient amplification (approximately stretched-exponential, as opposed to the power-law growth in the pre-LN baseline). Although the theoretical analysis correctly characterized the gap between the models at a qualitative level, it did not account for the attention mechanism.

In this blog post, I modify the theoretical argument by reintroducing attention, using the theoretical framework developed in [], which restricts the initial token configurations to permutation-invariant ones. We generalize the analysis in [] to normalization-free transformers by replacing the LayerNorms with point-wise activation functions. We show that attention does not change the mechanism that makes gradient propagation in normalization-free transformers inferior to that in pre-LN transformers. However, we can now demonstrate not only qualitative agreement between theoretical and empirical norms, gradients, and Jacobians, but also perfect quantitative agreement.

## How to read this post

## Background

<span id="references"></span>
## 4. References

<div id="refs"></div>


